package expo.modules.documentpicker

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.FileUtils
import expo.modules.core.utilities.FileUtilities
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.exception.toCodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.apache.commons.io.FilenameUtils
import java.io.File
import java.io.FileNotFoundException
import java.io.FileOutputStream

private const val OPEN_DOCUMENT_CODE = 4137

class DocumentPickerModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()
  private var pendingPromise: Promise? = null
  private var copyToCacheDirectory = true

  override fun definition() = ModuleDefinition {
    Name("ExpoDocumentPicker")

    AsyncFunction("getDocumentAsync") { options: DocumentPickerOptions, promise: Promise ->
      if (pendingPromise != null) {
        throw PickingInProgressException()
      }
      pendingPromise = promise
      copyToCacheDirectory = options.copyToCacheDirectory
      val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
        addCategory(Intent.CATEGORY_OPENABLE)
        putExtra(Intent.EXTRA_ALLOW_MULTIPLE, options.multiple)
        type = if (options.type.size > 1) {
          putExtra(Intent.EXTRA_MIME_TYPES, options.type.toTypedArray())
          "*/*"
        } else {
          options.type[0]
        }
      }
      appContext.throwingActivity.startActivityForResult(intent, OPEN_DOCUMENT_CODE)
    }

    OnActivityResult { _, (requestCode, resultCode, intent) ->
      if (requestCode != OPEN_DOCUMENT_CODE || pendingPromise == null) {
        return@OnActivityResult
      }

      val promise = pendingPromise!!

      if (resultCode == Activity.RESULT_OK) {
        try {
          if (intent?.clipData != null) {
            handleMultipleSelection(intent)
          } else {
            handleSingleSelection(intent)
          }
        } catch (e: Exception) {
          promise.reject(e.toCodedException())
        }
      } else {
        promise.resolve(
          DocumentPickerResult(canceled = true)
        )
      }

      pendingPromise = null
    }
  }

  private fun copyDocumentToCacheDirectory(documentUri: Uri, name: String): Uri {
    val outputFilePath = FileUtilities.generateOutputPath(
      context.cacheDir,
      "DocumentPicker",
      FilenameUtils.getExtension(name)
    )
    val outputFile = File(outputFilePath)
    context.contentResolver.openInputStream(documentUri).use { inputStream ->
      inputStream ?: throw FileNotFoundException("Inputstream for $documentUri was null.")
      FileOutputStream(outputFile).use { outputStream ->
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
          FileUtils.copy(inputStream, outputStream)
        } else {
          inputStream.copyTo(outputStream)
        }
      }
    }
    return Uri.fromFile(outputFile)
  }

  private fun handleSingleSelection(intent: Intent?) {
    intent?.data?.let { uri ->
      val details = readDocumentDetails(uri)
      val result = DocumentPickerResult(
        assets = listOf(details)
      )
      pendingPromise?.resolve(result)
    } ?: throw FailedToReadDocumentException()
  }

  private fun handleMultipleSelection(intent: Intent?) {
    val count = intent?.clipData?.itemCount ?: 0
    val assets = mutableListOf<DocumentInfo>()

    for (i in 0 until count) {
      val uri = intent?.clipData?.getItemAt(i)?.uri
        ?: throw FailedToReadDocumentException()
      val document = readDocumentDetails(uri)
      assets.add(document)
    }

    pendingPromise?.resolve(DocumentPickerResult(assets = assets))
  }

  private fun readDocumentDetails(uri: Uri): DocumentInfo {
    val originalDocumentDetails = DocumentDetailsReader(context).read(uri)

    val details = if (!copyToCacheDirectory) {
      originalDocumentDetails
    } else {
      val copyPath = copyDocumentToCacheDirectory(uri, originalDocumentDetails.name)
      originalDocumentDetails.copy(uri = copyPath)
    }

    return details
  }
}

import {
  SUPPORTED_DIRECTORIES,
  createGlobFilter,
  modifyFileDuringPipe,
} from '../createFileTransform';

describe(modifyFileDuringPipe, () => {
  for (const dir of SUPPORTED_DIRECTORIES) {
    it(`renames _${dir} to .${dir}`, () => {
      expect(
        modifyFileDuringPipe({
          path: `package/_${dir}/settings.json`,
          type: 'File',
        }).path
      ).toEqual(`package/.${dir}/settings.json`);
    });
  }
  it(`does not rename extraneous _ segments`, () => {
    expect(
      modifyFileDuringPipe({
        path: '_package/_vscode/settings.json',
        type: 'File',
      }).path
    ).toEqual('_package/.vscode/settings.json');
  });
  it(`renames multiple instances of _vscode`, () => {
    expect(
      modifyFileDuringPipe({
        path: '_package/_vscode/foo/_vscode/settings.json',
        type: 'File',
      }).path
    ).toEqual('_package/.vscode/foo/.vscode/settings.json');
  });
});

describe(createGlobFilter, () => {
  it('returns true for files within glob pattern', () => {
    expect(createGlobFilter('**/*.js')('index.js')).toBe(true);
    expect(createGlobFilter('specific-file.json')('specific-file.json')).toBe(true);
    expect(createGlobFilter('*/templates/package.json')('github-root/templates/package.json')).toBe(
      true
    );
  });

  it('returns false for files outside glob pattern', () => {
    expect(createGlobFilter('**/*.js')('somefile.kt')).toBe(false);
    expect(createGlobFilter('specific-file.json')('not-it.json')).toBe(false);
    expect(createGlobFilter('*/templates/package.json')('package.json')).toBe(false);

    // Dotfiles are ignored by default
    expect(createGlobFilter('**/*')('.npmignore')).toBe(false);
  });
});

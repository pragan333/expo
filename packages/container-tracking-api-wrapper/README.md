# container-tracking-api-wrapper

JavaScript/TypeScript wrapper for the [VesselFinder Container Tracking API](https://containertest.vesselfinder.com/api/).

## Installation

```sh
npm install container-tracking-api-wrapper
```

## Initialise API

On initialization you must provide your personal API key:

```ts
import { ContainerTrackingApi } from 'container-tracking-api-wrapper';

const api = new ContainerTrackingApi('YOUR_API_KEY');
```

## API Calls

- **(GET)** `ContainerTrackingApi.container(containerNumber*, sealine?, timeout?)`

**`*` Required parameters**

## Error Handling

All errors are thrown as standard `Error` instances.

```ts
try {
  const result = await api.container('SOME_CONTAINER_NUMBER');
  console.log(result);
} catch (e) {
  console.error(e.message);
}
```

## Container Method

### How it works

When you first search for a container, the API returns status `queued` (HTTP 202).
The wrapper keeps polling at 10-second intervals until:

1. The response status code is no longer `202`, **or**
2. The configured `timeout` is exhausted (throws `Error: Request timed out.`).

### Parameters

| Parameter          | Type               | Required | Default | Description |
|--------------------|--------------------|----------|---------|-------------|
| `containerNumber`  | `string` (length 11) | ✅      | —       | Container number, e.g. `"MEDU6965343"` |
| `sealine`          | `string` (2–4 chars) | ❌      | `"AUTO"` | Standard Carrier Alpha Code (SCAC), e.g. `"MSCU"` |
| `timeout`          | `number \| null`   | ❌       | `60`    | Max seconds to wait. Pass `0` or `null` for a single request. Must be ≥ 10 if non-zero. |

### Example

```ts
const result = await api.container('MEDU6965343', 'MSCU', 120);
console.log(result);
```

## Building

```sh
npm run build
```

## Testing

```sh
npm test
```

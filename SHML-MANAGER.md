# SHML Manager
The SHML manager class helps in reading SHML from a source string (often from a file). In addition to markup, this source contains a header with information about the type of markup contained, the version, and any compression and/or encryption.
This information is then used to find the right decompression, decryption, and markup parser to parse the text.
The manager also provides a way to create this formatted string.

## Format

```
:<flavor>:<version>:
<contents>
```

```
:<flavor>:<version>:<compression>:
<contents>
```

```
:<flavor>:<version>:<compression>:<encryption>:
<contents>
```
`flavor`, `compression`, and `encryption` must be composed of only uppercase letters, positive whole numbers, or dashes. `version` must be a valid [https://semver.org](version string). `contents` may be any string. If not provided, `” NONE"` is used as a default for `encryption` and `compression`.
## Methods
### `getInfo(source)`
This method teads the descriptors from the source without looking at the contents.
### `read(source, password)`
This method reads the descriptors and contents of the source. If the contents are compressed or encrypted, it trys to undo these transforms (throwing error if not possible). If encrypted, a password is required; otherwise, this field is optional. The password may be provided as a string or as optionally async function that returns a string. The function is only called if a password is needed.
### `write(data, password)`
This method crates a string representation of the data performing any specified encryption or compression if possible. If the requested transforms are not available, an error is thrown. The password field is the same as for reading except that it is used if any encryption is requested.

# SHML Manager
The SHML manager class helps in reading SHML from a source string (often from a file). In addition to markup, this source contains a header with information about the type of markup contained, the version, and any compression and/or encryption.
This information is then used to find the right decompression, decryption, and markup parser to parse the text.
The manager also provides a way to create this formatted string.

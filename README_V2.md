# SHML2
WIP, some things may not work yet  
SHML2 allows for easier configuration, but it still works out of the box like the original SHML. Version 2 applies formatting in different "passes". Passes can be created from scratch, created using helpers, or referenced from a collection of predefined options. SHML parsers can be created with a different list of passes to go through for each input. Earlier passes have higher priority. Most different formatting features are applied in their own passes; however, many simple formats like italics, bold, underlines, et al are applied in the same pass.
## Syntax
| Format        | Pattern      | HTML Tag(s) | Example                                      |
| ------------- | ------------ | ----------- | -------------------------------------------- |
| Italics       | `*<text>*`   | `<em>`      | `*Italics*` → `<em>Italics</em>`             |
| Bold          | `**<text>**` | `<strong>`  | `**Bold**` → `<strong>Bold</strong>`         |
| Underlined    | `__<text>__` | `<u>`       | `__Underlined__` → `<u>Underlined</u>`       |
| Highlighted   | `\|<text>\|` | `<mark>`    | `\|Marked\|` → `<mark>Marked</mark>`         |
| Strikethrough | `~~<text>~~` | `<del>`     | `~~Striked~~` → `<del>Striked</del>`         |
| Subscript     | `,,<text>,,` | `<sub>`     | `,,Subscript,,` → `<sub>Subscript</sub>`     |
| Superscript   | `^^<text>^^` | `<sup>`     | `^^Superscript^^` → `<sup>Superscript</sup>` |

## Comments
Source comments (`!!! comment`) are completely ignored while parsing SHML while standard comments (`!! comment`) are converted to HTML style comments in the output.
### Properties
Properties are defined with the following format `!key: value`. Only the first instance of each key is stored, all others are skipped. Values can be interpolated using `?[key]`. This interpolation takes place after all parsing so keys may be referenced before they are defined. If no value for a key is found when interpolating, no change to the text is made. Properties of the result can be modified with the `setProperties(key, value)` and changes will be reflected in any interpolation. Properties can be accessed with `getProperty(key)` and `getProperties()`. `hasProperty(key)` can be used to check if a property exists. If a property is defined as `!key` and has no value, it is assigned a default value of `"true"` (`!key:` has a value of `""`).
### Paragraphs
Any lines starting with `p: <text>` will be converted to HTML paragraphs. An additional pass is available to make any text blocks not already contained in a block node be wrapped in paragraph tags.

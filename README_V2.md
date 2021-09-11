# SHML2
WIP, some things may not work yet  
  
Version 2 of SHML uses PCRE instead of the built-in Regex engine. Because of this, it is only compatible with browsers that support WASM. (Note that it can still be used on the backend to generate files since modern Node.js supports WASM).
  
While SHML itself needs a relatively new version of JavaScript to run, the resulting HTML (obviously only the string output) should be backwards compatible and responsive with any reasonable browser and device. This means that SHML only works on newer browsers, but when used on the backend to generate pages, those pages should be useable everywhere.  
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
Source comments (`!!! comment`) are completely ignored while parsing SHML while standard comments (`!! comment`) are converted to HTML style comments in the output. Multiline/inline comments may be created using the HTML comment format or `!!!* Comment *!!!` for source comments or `!!* Comment *!!` for standard comments.
### Properties
Properties are defined with the following format `!key: value`. Only the first instance of each key is stored, all others are skipped. Values can be interpolated using `?[key]`. This interpolation takes place after all parsing so keys may be referenced before they are defined. If no value for a key is found when interpolating, no change to the text is made. Properties of the result can be modified with the `setProperties(key, value)` and changes will be reflected in any interpolation. Properties can be accessed with `getProperty(key)` and `getProperties()`. `hasProperty(key)` can be used to check if a property exists. If a property is defined as `!key` and has no value, it is assigned a default value of `"true"` (`!key:` has a value of `""`).
### Paragraphs
Any lines starting with `p: <text>` and any following lines that do not start off another block will be converted to HTML paragraphs. An additional pass is available to make any text blocks not already contained in a block node be wrapped in paragraph tags.
### Headers
Text following a `#` is displayed as a header. The number of pound signs present controls what size header is used where the hover the heater number, the smaller it becomes (up to level 6). Headsets may also be defined as `hn:` where n is an integer between 1 and 6 inclusive that represents the heater level. All the text after these markers up until the end of the line is part of the header. Headers are also given ids stop that they may be linked to. A cryb64 hash algorithm is used too generate unique ids for each unique header. If there are multiple headers that have the same text and same level that would then result in the same id, a trailing counter number is appended too tell them apart. It is possible to override the detail is by using `hn[custom_id]:` or `#[custom_id]`. To help limit id collisions, all ids are prefixed with `hn:` where n is the header level.
### Quotes
Start a line with `>> <text>`, `"<text>"`, or `blockquote: <text>` to embed a quote. If the next line starts with `- <text>`, the given text will be displayed as the author.
If using the second form, newlines are preserved:
```
"Hello
World"
- Bob Smith
```
### Line Breaks
Some formats like paragraphs can span multiple lines, but others don't. If a meeting is really needed in one of the formats that doesn't, the string `%%` can be used to insert a line break.
### Horizontal Rules
A horizontal bar can be inserted with 3 or more `-` or `=`. The number used does not matter and it's only variable to make source files easier to read and format.
### Text Alignment
Text can be aligned using one of the following `@center`, `@left`, `@right`, `@justify`, or `@reset`. All content following one of these markers well be aligned the given way until another market or the end of the source is found.

### Bulletpoints
Unordered lists may be created by starting a series of lines with a `+` or with `bull: `.

### Custom Symbols
Custom symbols may be created by passing a map of ids and values when creating the pass. No symbols are added by default. To combine a symbol password the default passes, use a pass collection. Symbols are referenced in markup using `:<id>:`.
### Raw HTML
Unlike the first version of SHML, version two provides some XXS protection. If using string methods, it is still higly encouraged to use a dedicated sanitation tool, but if using only the HTML element methods, SHML will prevent most raw HTML and JavaScript. When getting the HTML element representation of SHML instead of the string version, only the following HTML is allowed:
+ `style` tags and their contents
+ `h1`, `h2`, `h3`, `h4`, `h5`, `h6`, `p`, `strong`, `b`, `em`, `i`, `mark`, `del`, `ins`, `blockquote`, `dd`, `dl`, `dt`, `hr`, `br`, `li`, `ul`, `ol`, `abbr`, `bdi`, `bdo`, `cite`, `figure`, `figcaption`, `code`, `data`, `dfn`, `pre`, `kbd`, `q`, `s`, `ruby`, `rp`, `rt`, `samp`, `small`, `time`, `var`, `wbr`, `math` (and all related elements), `caption`, `col`, `colgroup`, `table`, `tbody`, `td`, `tfoot`, `th`, `thead`, `tr`, `details`, `dialog`, `summary`, `menu`, `sub`, and `sup` tags with no attributes
+ `a` with `href`, `title`, and `target` attributes  
The following may be enabled with a separate pass:
+ `img` tags with `src`, `width`, and `height`, and `style` attributes
+ `audio` (and `source`) tags with `src`, `loop`, `muted`, and `controls` attributes
+ `video` tags with `src`, `loop`, `muted`, `controls`, `height`, and `width` attributes
+ `div` and `span` tags with `style` attributes  
`src` and `href` attributes must only include the characters `a-zA-Z0-9_-./:?=&%#+@`. They may only contain `:` right after `http` or `https` or alternatively after `mailto` if a `href`. `sytle` attributes may only contain the characters `a-zA-Z0-9(),.%+-/*#:;!' `. All other attributes are limited to `a-zA-Z0-9_- `. Html escape characters using `&` are not permitted. Any legitimate need to escape something can be done with url encoding instead. Any remaining triangle brackets that do not form a whitelisted tag are escaped.  
Any CSS styles defined in a `style` tag are scoped to the resulting HTML.

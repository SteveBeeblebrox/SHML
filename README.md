# SHML ![GitHub](https://img.shields.io/github/license/SteveBeeblebrox/SHML?style=flat-square) ![GitHub last commit](https://img.shields.io/github/last-commit/SteveBeeblebrox/SHML?style=flat-square) ![GitHub issues](https://img.shields.io/github/issues-raw/SteveBeeblebrox/SHML?style=flat-square) ![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/SteveBeeblebrox/SHML?style=flat-square) ![GitHub contributors](https://img.shields.io/github/contributors/SteveBeeblebrox/SHML?color=007EC6&style=flat-square) ![GitHub Repo stars](https://img.shields.io/github/stars/SteveBeeblebrox/SHML?style=flat-square)
***Simplified HTML Markup Language (Or Simplified Hypertext Markup Language Markup Language)*** is a lightweight markup language parser built in JavaScript. The syntax is similar to that of Markdown, but with changes to make some things more intuitive. This software is distributed under the MIT license. A demo of SHML can be found [here](https://stevebeeblebrox.github.io/apps/shml).

## Syntax
SHML is composed of two main types of styling: inline and sections. All sections must be on their own line. Inline formatting can be applied to any part of a section.
### Inline Formatting
+ *Italics*
  * Formatting sequence: `*<text>*`
  * Resulting HTML Tag: `<em>`
  * Example: `*Italics*`
+ **Bold**
  * Formatting sequence: `**<text>**`
  * Resulting HTML Tag: `<strong>`
  * Example: `**Bold**`
+ ***Bold & Italics***
  * Formatting sequence: `***<text>***`
  * Resulting HTML Tags: `<strong>` & `<em>`
  * Example: `***Bold and Italics***`
+ Underlined
  * Formatting sequence: `__<text>__`
  * Resulting HTML Tag: `<u>`
  * Example: `__Underlined__`
+ ~~Strikethrough~~
  * Formatting sequence: `~~<text>~~`
  * Resulting HTML Tag: `<del>`
  * Example: `~~Strikethrough~~`
+ Superscript
  * Formatting sequence: `^<text>^`
  * Resulting HTML Tag: `<sup>`
  * Example: `^Superscript^`
+ Subscript
  * Formatting sequence: `,,<text>,,`
  * Resulting HTML Tag: `<sub>`
  * Example: `,,Subscript,,`
+ Highlighted
  * Formatting sequence: `|<text>|` or `|[#<hex color>] <text>|`
  * Resulting HTML Tag: `<mark>`
  * Example: `|Highlighted|` or `|[#FF00FF] Colored Highlight|`
  * Notes: If no color is given, the the default color for a `<mark>` element is used.
+ Colored Text
  * Formatting sequence: `&&<text>&&` or `&&[#<hex color>] <text>&&`
  * Resulting HTML Tag: `<span>`
  * Example: `&[#FF00FF] Colored Text&&`
  * Notes: If no color is given, the default color is red.
+ Word Break
  * Formatting sequence: `-/-`
  * Resulting HTML Tag: `<wbr>`
  * Example: `Pneumono-/-ultra-/-microscopic-/-silicovol-/-canoconiosis` (Yes that is a word. [Source](https://en.wikipedia.org/wiki/Longest_word_in_English#:~:text=Pneumonoultramicroscopicsilicovolcanoconiosis))
+ `Code`
  * Formatting sequence: `` `<text>` ``
  * Resulting HTML Tag: `<code>`
  * Example: ``` `Code` ```
  * Notes: Aside from a `` ` ``, all other formatting sequence are escaped.
+ [Links](https://www.youtube.com/watch?v=oHg5SJYRHA0) <!--¯\_(ツ)_/¯-->
  * Formatting sequence: `[<text>](<url>)` (Opens in current tab or frame [`target="_self"`]) or `+[<text>](<url>)` (Opens in new tab [`target="_blank"`])
  * Resulting HTML Tag: `<a>`
  * Example: `[Links](https://stevebeeblebrox.github.io)` (Opens in current tab or frame [`target="_self"`]) or `+[Links](https://stevebeeblebrox.github.io)` (Opens in new tab [`target="_blank"`])
  * Notes: A link's text &amp; title are set to the contents of the `[]`. There are no restrictions on link values. You can use `mailto` links, `http` links, `https` links, relative links, or any other link that is valid for an HTML anchor `href`.
+ Special Tokens
  * Formating sequence: `:<key>:`
  * Resulting HTML Tag: N/A
  * Example: `:tableflip:`
  * Notes: If no matching token is found, no changes are made. No tokens exist by default. To use tokens, pass an object as the second argument to `parseMarkup` or `parseInlineMarkup`. Any token that matches a key in the object (value is not undefined or null) will be replaced by the value represented by that key. If a simple map of values does not meet your needs, you can also use a Proxy with a trap on get to handle what is associated with each token.
+ Additional Characters
  * Formatting sequence: `/<mark><base letter>/`
  * Resulting HTML Tag: N/A
  * Example: `/~n/`
  * Notes: Invalid combinations are ignored. See the below table for a list of possible marks. Case is respected when converting characters and mark type is case sensitive. In addition to the standard format for letters, `/!/` and `/?/` can also be used to create upside down exclamation and question marks respectively.
  
  <br>
  
   |   | Mark Type           |
   | - | ------------------- |
   | ~ | Tilde               |
   | : | Umlaut or Diaeresis |
   | ' | Acute Accent        |
   | " | Dobule Acute Accent |
   | ` | Grave Accent        |
   | ^ | Circumflex          |
   | o | Ring                |
   | / | Slash               |
   | , | Cedilla             |
   | - | Macron              |
   | u | Breve               |
   | . | Dot                 |
   | ? | Ogonek              |
   | v | Caron               |
   | _ | Stroke              |
### Section Formatting
+ Headers (Levels 1-6)
  * Formatting sequence: `<# repeated n times><text>` or `h<n>: <text>` as the first non-whitespace characters in a line where n is a number 1-6 inclusive and corresponds to the desired level header
  * Needs closing sequence: No
  * Resulting HTML Tag: `<h1>`, `<h2>`, `<h3>`, `<h4>`, `<h5>`, or `<h6>`
  * Example: `##Header Two` or `h2:Header Two`
  * Notes: See *Section Metadata* for more information on headers.
+ Paragraphs
  * Formatting sequence: `p: <text>` as the first non-whitespace characters in a line
  * Resulting HTML Tag: `<p>`
  * Example: `p: Paragraph`
+ Horizontal Rule
  * Formatting sequence: `-` repeated 3 or more times as the only non-whitespace characters in a line
  * Resulting HTML Tag: `<hr>`
  * Example: `Part 1\n---\nPart 2`
+ Raw HTML
  * Notes: HTML can be included in SHML. The contents of HTML tags can still contain SHML markup (both inside of the tags and in attributes)
+ Blockquotes
  * Formatting sequence: `>> <text>` as the first non-whitespace characters in a line
  * Resulting HTML Tag: `<blockquote>`
  * Example: `>> "Hello World"`
+ Images - to include a basic image, surround the link in square brackets on a new line. If you wish to add alternate text, put that text inside of square brackets followed by an image reference in parentheses like this `[alt text (image_url)]`. In both formats, including a space, then a number, an x, and one more number after the url (like `image_url 20x20`) will cause the image to use those values (in px) for its width and height respectively instead of its actual size (using a zero for one of the values makes that dimension use auto sizing)  
+ Tables - to create a table, start it with `[[` and close it with `]]`. Any new lines between these will be treated as rows. Columns are marked by splitting rows with commas. To escape commas (for use in numbers, subscript, etc...) use `$,` to escape the comma and not define a column
  
**Work in progress, expect major changes!**
<!--### Properties
SHML can be given additional string keys to look for. This allows for the storage of metadata within SHML text that can be pulled from the result. Properties are passed as an array of strings in the second argument to `parseMarkup`. If no properties are passed in the second argument, the parser will look at the global property `properties` of SHML. They can be retrieved by calling `getProperty` on the result and passing the name of the property to retrieve as a string. By default, SHML does not look for any properties. Properties are not supported in inline markup.-->
### Section Metadata
+ Single Line Comments
  * Formatting sequence: `!!<comment>`
  * Resulting HTML Tag: None
  * Example: `!!Work in progress`
  * Notes: SHML has no multiline comments of its own; however, you can use HTML's `<!-- -->`.
  * Retrieval: Comment metadata cannot be retrieved from the parsing result and is only avalible in the source.
+ Properties
  * Formatting sequence: `!<key>:<value>`
  * Resulting HTML Tag: None
  * Example: `!title: My Article`
  * Notes: If a key already has a value, any new value is ignored. See the Templates formatting in the Miscellaneous section for more uses of properties.
  * Retrieval: To retrieve a specific property, pass the key to retrieve to `getProperty` on the parsing result. To get an iterable list of all discovered properties, call `getProperties` on the parsing result. Although it is slower that `getProperty`, you can use bracket notation to get the value of a key from the list of all properties.
+ Headers With Ids (Levels 1-6)
  * Formatting sequence: `<# repeated n times>[<id>]<text>` or `h<n>[<id>]:` as the first non-whitespace characters in a line where n is a number 1-6 inclusive and corresponds to the desired level header and id the the desired identifier
  * Resulting HTML Tag: `<h1>`, `<h2>`, `<h3>`, `<h4>`, `<h5>`, or `<h6>`
  * Example: `##[some_id] Header Two` or `h2[some_id]:Header Two`
  * Notes: To prevent id collisions, all ids generated by SHML are prefixed with `h<n>:` (So `h1[foo]: Hello` actually has an id of `h1:foo` instead of just `foo`). Any headers where an id is not stated recieve a generated id based off hashing the header's contents. Again, this is prefixed to avoid collisions.
  * Retrieval: SHML keeps a list of all generated ids that can be retrieved using the `getIds` function on a parsing result. These ids can also be used with JavaScript and CSS (note that the `:` in the id must be escaped when using selectors) and referenced as links.
### Miscellaneous
+ Line Break
  * Formatting sequence: `%%`
  * Resulting HTML Tag: `<br>`
  * Example: `Hello%%World`
  * Notes: Line breaks are valid in any context.
+ Escaped Characters
  * Formatting sequence: `$$<escaped text>$$`
  * Resulting HTML Tag: None
  * Example: `$$**Not Bold**$$`
  * Notes: Aside from a `$$`, all other formatting sequence are escaped. Unlike a code block, no additional formatting is applied. Escaped characters are valid in any context.
+ Templates
  * Formatting sequence: `?<[<id>]>`
  * Resulting HTML Tag: Not Applicable
  * Example:
  ```
  !name: Aim/'e/e 
  # Meaning of the Name ?<[name]>
  ?<[name]> is a French name meaning "beloved"
  ```
  * Notes: Templates look for a matching property previously defined in the document. If a property is found, the template reference is replaced with the value of the property. The value may contain inline and section formatting; however, since section escape sequences are processed before templates, escape sequences contained in the value are only applied to inline formatting. If no mathing property is found, the template reference is left as is and will appear in the output.
## Usage
### Overview
SHML does not modify the document in any way. It does not reformat any elements. SHML converts one string into another string. That is it. You must give it the string to parse and then do something with the result. **SHML is not XSS secure!** If you are going to use SHML to allow users to format text (in comments for example), make sure to sanitize the input **AFTER** it is sent through SHML.  
  
Ok, enough talk. I know what you are really looking for...
### Examples
#### Example 1: Basic Usage
##### Code
```html
<template class="shml">
 !title: SHML Example 1
 h1: Hello World
</template>
<script>
  (function() {
    let element = document.querySelector('template.shml');
    let result = SHML.parseMarkup(element.innerHTML);
    element.insertAdjacentHTML('afterend', result.toHTML());
    document.title = result.getProperty('title');
  })();
</script>
```
##### Equivalent HTML
```html
<h1>Hello World</h1>;
```
##### Explanation
The above example gets the HTML contents of the template element and parses them for sections such as headers as well as inline formatting like bold or underlined text. The parser also stores the value of the property "title" for later use. Next, the formatted text is inserted after the template, so it appears on the document. Finally, the document title is set to the "title" property from the markup.
#### Example 2: Inline Formatting
##### Code
```html
<script>
  (function() {
    document.write(SHML.parseInlineMarkup('**Hello ~~World~~ User!**%%*This is an example of inline formatting.*').toHTML())
  })();
</script>
```
##### Equivalent HTML
```html
<strong>Hello <del>World</del> User!</strong><br><em>This is an example of inline formatting.</em>
```
##### Explanation
The above code parses the string for inline formatting and writes the result to the document. Any inline formatting like bold or underlined text will be formatted, but properties, headers, and other sections will not be parsed (line breaks count as inline formatting in this case and are still parsed).
#### Example 3: Styling The Result
```html
<style>
 .shml-result strong {
     color: blue;
 }
</style>
<strong>Hello-</strong>
<span class="shml-result">
 <script>
   document.write(SHML.parseInlineMarkup("**World**").toHTML())    
 </script>
</span>
```
##### Equivalent HTML
```html
<strong>Hello-</strong><span style="color: blue;"><strong>World</strong></span>
```
##### Explanation
SHML does not provide a way to override the styles for the elements it generates, nor does it add any class that could be used to identify the output in the document. If you wish to apply styling to the output HTML, the easiest way to do this is to insert the result into an element with a class or id and then use a CSS selector to target specific types of elements within that wrapper element. In the above example, the HTML resulting from parsing `**World**` is put into a `<span>` element with the class `shml-result` (Note that the class name could also be `wasdf`. There is nothing special about including `shml` in the name.). Finally, a CSS selector is used to style all `<strong>` elements within a element that has the class `shml-result` which results in "World" being blue (but not "Hello-").
#### Example 4: Tables
```html
<script>
 document.write(SHML.parseMarkup(`
[[
    First Name,  Last Name,  Age, Fav. Color
    Steve,       Beeblebrox, 27,  Blue
    Bob,         Smith,      32,  Green
    Jill,        Smith,      29,  Red
]]
`).toHTML());
</script>
```
##### Equivalent HTML
```html
<table>
  <tbody>
   <tr><th>First Name</th><th>Last Name</th><th>Age</th><th>Fav. Color</th></tr>
   <tr><td>Steve</td><td>Beeblebrox</td><td>27</td><td>Blue</td></tr>
   <tr><td>Bob</td><td>Smith</td><td>32</td><td>Green</td></tr>
   <tr><td>Jill</td><td>Smith</td><td>29</td><td>Red</td></tr>
 </tbody>
</table>
 ```
##### Explanation
SHML parses the given markup and converts it into a HTML table. Each new line is treated as a row (with the first row consisting of header cells) and each unsecaped comma in the row defines the boundary between cells. The parsing result is then written to the document.

#### Example 5: Additional Characters
```html
<script>
 document.write(SHML.parseMarkup(`
p: /!/T/'u/ puedes escribir en espa/~n/ol!
`).toHTML());
</script>
```
##### Equivalent HTML
```html
<p>&iexcl;T&uacute; puedes escribir en espa&ntilde;ol!</p>
 ```
##### Explanation
The special character format is used to create an upside down `!`, a `u` with an accent, and an `n` with a tilde.

#### Example 6: Custom Tokens
```html
<script>
 document.write(SHML.parseInlineMarkup('**Support LGBT!** :rainbow-flag:', {'rainbow-flag': '🏳‍🌈'}).toHTML());
</script>
```
##### Equivalent HTML
```html
<strong>Support LGBT!</strong> 🏳‍🌈
 ```
##### Explanation
By passing a map of strings as the second argument, SHML will convert any occurances of the keys surrounded by `:` into their matching values.

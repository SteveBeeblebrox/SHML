# SHML
Simplified HTML Markup Language (Or Simplified Hypertext Markup Language Markup Language)

## Syntax
SHML is composed of two main types of styling: inline and sections. All sections must be on their own line. Inline formatting can be applied to any part of a section.
### Inline Formatting
+ *Italics*
  * Formatting sequence: `*`
  * Needs closing sequence: Yes
  * Actual HTML Tag: `<em>`
  * Example: `*Italics*`
+ **Bold**
  * Formatting sequence: `**`
  * Needs closing sequence: Yes
  * Actual HTML Tag: `<strong>`
  * Example: `**Bold**`
+ ***Bold & Italics***
  * Formatting sequence: `***`
  * Needs closing sequence: Yes
  * Actual HTML Tag: `<strong>` & `<em>`
  * Example: `***Bold and Italics***`
+ Underlined
  * Formatting sequence: `__`
  * Needs closing character: Yes
  * Actual HTML Tag: `<u>`
  * Example: `__Underlined__`
+ ~~Strikethrough~~
  * Formatting sequence: `~~`
  * Needs closing sequence: Yes
  * Actual HTML Tag: `<del>`
  * Example: `~~Strikethrough~~`
+ Superscript
  * Formatting sequence: `^`
  * Needs closing sequence: Yes
  * Actual HTML Tag: `<sup>`
  * Example: `^Superscript^`
+ Subscript
  * Formatting sequence: `,,`
  * Needs closing sequence: Yes
  * Actual HTML Tag: `<sub>`
  * Example: `,,Subscript,,`
+ Highlighted
  * Formatting sequence: `|`
  * Needs closing sequence: Yes
  * Actual HTML Tag: `<mark>`
  * Example: `|Highlighted|`
+ Word Break
  * Formatting sequence: `--`
  * Needs closing sequence: No
  * Actual HTML Tag: `<wbr>`
  * Example: `Pneumono--ultra--microscopic--silicovol--canoconiosis` (Yes that is a word. [Source](https://en.wikipedia.org/wiki/Longest_word_in_English#:~:text=Pneumonoultramicroscopicsilicovolcanoconiosis))
+ `Code`
  * Formatting sequence: `` ` ``
  * Needs closing sequence: Yes
  * Actual HTML Tag: `<code>`
  * Example: ``` `Code` ```
  * Notes: Aside from a `` ` ``, all other formatting sequence are escaped.
+ Escaped Characters
  * Formatting sequence: `$$`
  * Needs closing sequence: Yes
  * Actual HTML Tag: None
  * Example: `$$**Not Bold**$$`
  * Notes: Aside from a `$$`, all other formatting sequence are escaped. Unlike a code block, no additional formatting is applied.
+ [Links](https://www.youtube.com/watch?v=oHg5SJYRHA0) <!--¯\_(ツ)_/¯-->
  * Formatting sequence: `[<text to display>](<url>)`
  * Needs closing sequence: No
  * Actual HTML Tag: `<a>`
  * Example: `[Links](https://stevebeeblebrox.github.io)`
  * Notes: All links open in a new tab.
### Section Formatting
<!--Header 1-6 - Start a line with `h<number here>: ` (for example `h1:`)  
Paragraph - Start a line with a `p: `  
Horizontal Rule - Start a line with three or more `-`  
Raw HTML - Any valid SHML is valid HTML and any HTML is also valid SHML. Any section starting with a `<` and ending with a `>` (ignoring whitespace) is treated as HTML and does not have any inline formatting applied  
Comments - any line that is not a valid section (or a line break, see below) is ignored-->
**Work in progress, expect major changes!**
### Properties
SHML can be given additional string keys to look for. This allows for the storage of metadata within SHML text that can be pulled from the result. Properties are pased as an array of strings in the second argument to `parseMarkup`. They can be retrieved by calling `getProperty` on the result and passing the name of the property to retrieve as a string.
### Miscellaneous
+ Line Break
  * Formatting sequence: `%%`
  * Needs closing sequence: No
  * Actual HTML Tag: `<br>`
  * Example: `Hello%%World`
## Usage
SHML does not modify the document in any way. It does not format any particular elements. SHML converts a string into another string. That is it. You must give it the string to parse and then do something with the result. **SHML is not XSS secure!** If you are going to use SHML to allow users to format text (in comments for example), make sure to sanitize the input **after** it is sent through SHML.  
Ok, enough talk. I know what you are really looking for...
### Example 1
#### Code
```html
<template class="shml">
 !title: SHML Example 1
 h1: Hello World
</template>
<script>
  (function() {
    let element = document.querySelector('template.shml');
    let result = SHML.parseMarkup(element.innerHTML, ['title']);
    element.insertAdjacentHTML('afterend', result.toHTML());
    document.title = result.getProperty('title');
  })();
</script>
```
#### Parsing Result
```html
<h1>Hello World</h1>;
```
#### Explanation
The above example gets the HTML contents of the template element and parses them for sections such as headers as well as inline formatting like bold or underlined text. The method is also told to look for a property called title. Next, the formatted text is insered after the template so it appears on the document. Finally, the document title is set to the title property of the markup that was requested earlier.
### Example 2
#### Code
```html
<script>
  (function() {
    document.write(SHML.parseInlineMarkup('**Hello ~~World~~ User!**%%*This is an example of inline formatting.*'))
  })();
</script>
```
#### Parsing Result
```html
<strong>Hello <del>World</del> User!</strong><br><em>This is an example of inline formatting.</em>
```

#### Explanation
The above code parses the string for inline formatting and writes the result to the document. Any inline formatting like bold or underlined text will be formatted, but headers and other sections will not be (line breaks count as inline formatting in this case).

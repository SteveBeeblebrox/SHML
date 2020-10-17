# SHML
Simplified HTML Markup Language (Or Simplified Hypertext Markup Language Markup Language)

## Syntax
SHML is composed of two main types of styling: inline and sections. All sections must be on their own line. Inline formatting can be applied to any part of a section.
### Inline Formatting
*Italics* - Wrap text in a single `*`  
**Bold** -  Wrap text in a double `*`  
***Bold & Italics*** - Wrap text in three `*`  
Underlined - Wrap text in two `__`  
~~Strikethrough~~ - Wrap text in two `~`
Superscript - Wrap text in one `^`  
Subscript - Wrap text in two `,`  
Highlighted - Wrap text in a single `|`  
Word Break - Include two `-` where you want a word to break onto a new line if needed
`Code` - Wrap text in a single backtick  
[Links](https://stevebeeblebrox.github.io) - Put the text you want to display in square brackets followed by the url in parentheses (`[<Title>](<url>)`). Currently all links open in a new tab.
### Section Formatting
Header 1-6 - Start a line with `h<number here>: ` (for example `h1:`)  
Paragraph - Start a line with a `p: `  
Horizontal Rule - Start a line with three or more `-`  
Raw HTML - Any valid SHML is valid HTML and any HTML is also valid SHML. Any section starting with a `<` and ending with a `>` (ignoring whitespace) is treated as HTML and does not have any inline formatting applied  
Comments - any line that is not a valid section (or a line break, see below) is ignored
### Properties
SHML can be given additional string keys to look for. This allows for the storage of metadata within SHML text that can be pulled from the result. Properties are pased as an array of strings in the second argument to `parseMarkup`. They can be retrieved by calling `getProperty` on the result and passing the name of the property to retrieve as a string.
### Miscellaneous
Line Break - A double `%` (inline or as a standalone section) is converted into a line break  
## Usage
shml.js only provides the methods needed to convert a SHML string to HTMl. It will not modify any HTML elements. It must be given the SHML as a string and it will output HTML that can be added to a document.
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
The above example gets the HTML contents of the template element and parses them for sections such as hearers as well as inline formatting like bold or underlined text. The method is also told to look for a property called title. Next, the formatted text is insered after the template so it appears on the document. Finally, the document title is set to the title property of the markup that was requested earlier.
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

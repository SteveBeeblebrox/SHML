function parseMD(markdown = '', properties = []) {
  let data = {
    properties: {},
    stack: [],
    toHTML: () => data.stack.join(''),
    get: (property) => data.properties[property]
  };
  let push = object => data.stack.push(object);
  let parseForInlineFormatting = str =>
    str
    .replace(/(\*\*\*)(.*?)\1/gs, '<strong><i>$2</i></strong>')
    .replace(/(\*\*)(.*?)\1/gs, '<strong>$2</strong>')
    .replace(/(\*)(.*?)\1/g, '<i>$2</i>')
    .replace(/(__)(.*?)\1/g, '<u>$2</u>')
    .replace(/(~~)(.*?)\1/g, '<del>$2</del>')
    .replace(/(`)(.*?)\1/g, '<code>$2</code>')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" title="$1" target="_blank">$1</a>')
    .replace(/%%/g, '<br>')
    ;
  let parseForSection = (tag, str, key = tag) => str.replace(new RegExp('\s*' + key + ':(.*)', 'g'), (str, match) => (push('<' + tag + '>' + parseForInlineFormatting(match.trim()) + '</' + tag + '>'), ''));
  markdown.split(/\n/g).forEach((object, index, array) => {
    if(object.trim().startsWith('<') && object.trim().endsWith('>')) push(object);
    else {
      for(var property of properties)
        if(data.properties[property] === undefined)
          object.replace(new RegExp('\s*' + property + ':(.*)'), (str, match) => (data.properties[property] = match.trim(), ''));

      for(var i = 1; i < 7; i++) parseForSection('h' + i, object);
      parseForSection('p', object);
      object.replace(new RegExp('\s*(?:bull:|\\+)(.*)', 'g'), (str, match) => (push('<ul><li>' + parseForInlineFormatting(match.trim()) + '</li></ul>'), ''));
      object.replace(/\s*---+\s*/, () => (push('<hr>'), ''));
      object.replace(/\s*%%\s*/, () => (push('<br>'), ''));
    }
  });
  return data;
}

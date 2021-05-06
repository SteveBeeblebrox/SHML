const SHML_TOKENS = {
  'tableflip': `(╯°□°）╯︵ ┻━┻`,
  'shrug': '¯\\_(ツ)_/¯`
}

function handleCustomSHMLToken(token) {
  return DEFAULT_TOKENS[token] ?? '[Unknown Token]';
}

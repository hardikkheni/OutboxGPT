function format(text, obj) {
  // Use regular expression to find words between curly braces
  const regex = /{([^}]+)}/g;

  // Replace \n with a special token
  const token = '__NEWLINE_TOKEN__';
  const textWithToken = text.replace(/\n/g, token);

  // Replace placeholders with object property values
  const replacedText = textWithToken.replace(regex, (match, capturedGroup) => {
    const propertyName = capturedGroup.trim();
    const replacement = obj[propertyName];
    return replacement !== undefined ? String(replacement) : match;
  });

  // Replace the special token back to \n
  const finalText = replacedText.replace(new RegExp(token, 'g'), '<br/>');
  return finalText;
}

module.exports = { format };

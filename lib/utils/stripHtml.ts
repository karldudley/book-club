const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&nbsp;': ' ',
  '&mdash;': '—',
  '&ndash;': '–',
  '&hellip;': '…',
  '&rsquo;': '’',
  '&lsquo;': '‘',
  '&rdquo;': '”',
  '&ldquo;': '“',
  // Latin-1 accents — common in author names and translated titles.
  '&agrave;': 'à', '&aacute;': 'á', '&acirc;': 'â', '&atilde;': 'ã',
  '&auml;': 'ä', '&aring;': 'å', '&aelig;': 'æ', '&ccedil;': 'ç',
  '&egrave;': 'è', '&eacute;': 'é', '&ecirc;': 'ê', '&euml;': 'ë',
  '&igrave;': 'ì', '&iacute;': 'í', '&icirc;': 'î', '&iuml;': 'ï',
  '&ntilde;': 'ñ', '&ograve;': 'ò', '&oacute;': 'ó', '&ocirc;': 'ô',
  '&otilde;': 'õ', '&ouml;': 'ö', '&oslash;': 'ø', '&ugrave;': 'ù',
  '&uacute;': 'ú', '&ucirc;': 'û', '&uuml;': 'ü', '&yacute;': 'ý',
  '&yuml;': 'ÿ', '&szlig;': 'ß',
  '&Agrave;': 'À', '&Aacute;': 'Á', '&Acirc;': 'Â', '&Auml;': 'Ä',
  '&Ccedil;': 'Ç', '&Egrave;': 'È', '&Eacute;': 'É', '&Ecirc;': 'Ê',
  '&Iacute;': 'Í', '&Ntilde;': 'Ñ', '&Oacute;': 'Ó', '&Ouml;': 'Ö',
  '&Oslash;': 'Ø', '&Uacute;': 'Ú', '&Uuml;': 'Ü',
}

/**
 * Google Books descriptions arrive as HTML fragments — <p>, <br>, <b>, <i> and
 * escaped entities are all common. It is third-party content, so it must never
 * reach dangerouslySetInnerHTML; flatten it to plain text instead.
 */
export function stripHtml(input: string | null | undefined): string {
  if (!input) return ''

  return input
    // Block-level breaks become paragraph breaks so the blurb keeps its shape.
    .replace(/<\/(p|div|h[1-6]|li)>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    // Case matters for accents (&Eacute; vs &eacute;), so try exact first.
    .replace(/&[a-z]+;/gi, entity => ENTITIES[entity] ?? ENTITIES[entity.toLowerCase()] ?? entity)
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    .trim()
}

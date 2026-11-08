export function groupAnagramsTally(strs: string[]): string[][] {
  const groups = new Map<string, string[]>() // [1] fingerprint -> the words that share it
  for (const word of strs) {
    const count = new Array<number>(26).fill(0)
    for (const ch of word) count[ch.charCodeAt(0) - 97]++
    const key = count.join('#') // [2] letter counts are the key; '#' keeps 1,11 apart from 11,1
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(word) // [3] drop the word into its bin
  }
  return [...groups.values()] // [4] the bins are the answer
}

// Rebuilds src/data/neetcode150.json from the data file the NeetCode site itself is built from
// (github.com/neetcode-gh/leetcode, .problemSiteData.json). Only metadata is kept:
// title, category, difficulty, LeetCode slug, NeetCode video id. No problem or editorial text.
import { writeFileSync } from 'node:fs'

const SOURCE = 'https://raw.githubusercontent.com/neetcode-gh/leetcode/main/.problemSiteData.json'
const raw = await (await fetch(SOURCE)).json()
const list = raw.filter((p) => p.neetcode150)
if (list.length !== 150) throw new Error(`expected 150 problems, got ${list.length}`)
const out = list.map((p) => ({
  slug: p.link.replace(/\/$/, ''),
  title: p.problem,
  category: p.pattern,
  difficulty: p.difficulty,
  video: p.video || null,
}))
writeFileSync(new URL('../src/data/neetcode150.json', import.meta.url), JSON.stringify(out, null, 2) + '\n')
console.log('wrote', out.length, 'problems')

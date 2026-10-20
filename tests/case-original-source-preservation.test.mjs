import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

for (const channel of ['qianwen', 'doubao']) {
  test(`${channel} case MIA query preserves original content and scope`, async () => {
    const source = await readFile(new URL(`../scripts/${channel}-cases/fetch-all.sh`, import.meta.url), 'utf8');
    const queries = source.split('\n').filter(line => line.startsWith('F "$W/m_mia_msgs.json"'));
    assert.equal(queries.length, 1, 'one authoritative MIA raw query');
    const query = queries[0];
    assert.doesNotMatch(query, /\b(?:LEFT|SUBSTR(?:ING)?)\s*\(\s*content\b/i, 'never truncate original content');
    assert.match(query, /session_id,\s*content(?:\s+AS\s+content)?,\s*create_time\s+FROM/i, 'select full content');
    assert.match(query, /WHERE\s+owner_id\s+IN\s*\(\$IDS\)\s+AND\s+deleted_at\s+IS\s+NULL\s+AND\s+create_time<'\$CUT'/i, 'retain owner, deletion and cutoff scope');
    assert.match(query, /ORDER BY\s+owner_id,\s*create_time\s+LIMIT\s+2000/i, 'retain stable ordering and existing limit');
  });
}

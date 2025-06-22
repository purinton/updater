import { notifyUpdate } from '../src/notifyUpdate.mjs';

describe('notifyUpdate', () => {
  it('sends update embed with correct content and thumbnail', async () => {
    let sent;
    const sendMsg = async (msg) => { sent = msg; };
    await notifyUpdate({ username: 'user', host: 'host', result: 'foo\nbar\nLast metadata expiration: ignore\n\n', sendMsg });
    expect(sent.body.embeds).toBeDefined();
    expect(sent.body.embeds[0].title).toBe('Updates available on host');
    expect(sent.body.embeds[0].color).toBe(0xFFD700);
    expect(sent.body.embeds[0].description).toContain('foo');
    expect(sent.body.embeds[0].description).toContain('bar');
    expect(sent.body.embeds[0].description).not.toContain('Last metadata expiration');
    expect(sent.body.embeds[0].description.startsWith('```')).toBe(true);
    expect(sent.body.embeds[0].description.endsWith('```')).toBe(true);
    expect(sent.body.embeds[0].thumbnail).toBeDefined();
    expect(sent.body.embeds[0].thumbnail.url).toBe('https://purinton.us/logos/purinton_64.png');
  });
});

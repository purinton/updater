import { notifyUpdate } from '../src/notifyUpdate.mjs';

describe('notifyUpdate', () => {
  it('sends update message with correct content', async () => {
    let sent;
    const sendMsg = async (msg) => { sent = msg; };
    await notifyUpdate({ username: 'user', host: 'host', result: 'foo\nbar', sendMsg });
    expect(sent.body.content).toContain('Updates found on user@host');
    expect(sent.body.content).toContain('foo');
    expect(sent.body.content).toContain('bar');
  });
});

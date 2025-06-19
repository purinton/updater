import { notifyError } from '../src/notifyError.mjs';

describe('notifyError', () => {
  it('sends error message with correct content', async () => {
    let sent;
    const sendMsg = async (msg) => { sent = msg; };
    const err = new Error('fail');
    await notifyError({ username: 'user', host: 'host', err, sendMsg });
    expect(sent.body.content).toContain('Error checking updates on user@host');
    expect(sent.body.content).toContain('fail');
  });
});

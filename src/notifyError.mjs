export async function notifyError({ username, host, err, sendMsg }) {
    await sendMsg({ body: { content: `Error checking updates on ${username}@${host}:
${err?.message}` } });
}

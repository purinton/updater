export async function notifyUpdate({ username, host, result, sendMsg }) {
    await sendMsg({ body: { content: `Updates found on ${username}@${host}:
${result.slice(0, 1900)}` } });
}

export async function notifyUpdate({ host, result, sendMsg }) {
    const filtered = result
        .split(/\r?\n/)
        .filter(line => line.trim() && !line.startsWith('Last metadata expiration'))
        .join('\n');
    await sendMsg({
        body: {
            embeds: [
                {
                    title: `Updates available on ${host}`,
                    color: 0xFFD700, // Gold
                    description: '```' + filtered.slice(0, 2048) + '```',
                    thumbnail: { url: 'https://purinton.us/logos/purinton_64.png' }
                }
            ]
        }
    });
}

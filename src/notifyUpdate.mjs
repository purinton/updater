export async function notifyUpdate({ host, result, sendMsg }) {
    // Parse each line to extract only the package name (before first dot)
    const filtered = result
        .split(/\r?\n/)
        .filter(line => line.trim() && !line.startsWith('Last metadata expiration'))
        .map(line => line.split(/\s+/)[0].split('.')[0])
        .filter(Boolean)
        .join('\n');
    await sendMsg({
        body: {
            embeds: [
                {
                    title: `Updates available on ${host}`,
                    color: 0xFFD700, // Gold
                    description: '```' + filtered.slice(0, 2000) + '```',
                    thumbnail: { url: 'https://purinton.us/logos/purinton_64.png' }
                }
            ]
        }
    });
}

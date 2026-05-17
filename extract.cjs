const fs=require('fs');
const html=fs.readFileSync('live_site.html', 'utf8');
const start=html.indexOf('<nav class="post-pagination');
const end=html.indexOf('</nav>', start);
console.log(html.slice(start, end+6));

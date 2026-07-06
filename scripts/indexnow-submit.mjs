const host = 't-agung.id';
const key = process.env.INDEXNOW_KEY;
const keyLocation = `https://${host}/${key}.txt`;

const urlList = [
  'https://t-agung.id/', 
  'https://t-agung.id/blog/oled-deepdive-1-apa-itu-oled/'
];

const body = {
  host,
  key,
  keyLocation,
  urlList
};

const res = await fetch('https://api.indexnow.org/IndexNow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify(body)
});

console.log('Status:', res.status);
console.log('Response:', await res.text());
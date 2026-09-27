const host = 't-agung.id';
const key = 91e21496916c42b18f8dd02d747a8421;
const keyLocation = `https://${host}/${key}.txt`;

const urlList = [
  'https://t-agung.id/', 
  'https://t-agung.id/blog/blog42_recall_gagang_pintu_china_4_juta/', 
  'https://t-agung.id/blog/oled-deepdive-6-manufacturing/' 
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
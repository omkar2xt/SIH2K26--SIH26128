import https from 'https';
import fs from 'fs';
import path from 'path';

const geoDir = path.join(process.cwd(), 'src', 'assets', 'geo');
if (!fs.existsSync(geoDir)) {
  fs.mkdirSync(geoDir, { recursive: true });
}

const outFile = path.join(geoDir, 'maharashtra-districts.geojson');

console.log('Downloading GeoJSON...');
https.get('https://raw.githubusercontent.com/geohacker/india/master/district/india_district.geojson', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const allIndia = JSON.parse(data);
      // Filter for Maharashtra
      const mhFeatures = allIndia.features.filter(f => f.properties.NAME_1 === 'Maharashtra');
      
      const mhGeo = {
        type: "FeatureCollection",
        features: mhFeatures
      };
      
      fs.writeFileSync(outFile, JSON.stringify(mhGeo, null, 2));
      console.log(`Successfully extracted ${mhFeatures.length} districts for Maharashtra to ${outFile}`);
    } catch(e) {
      console.error('Error parsing JSON or filtering:', e);
    }
  });
}).on('error', err => {
  console.error('Error downloading:', err.message);
});

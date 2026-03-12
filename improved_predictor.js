/**
 * Super Brain V3 - Improved Daily Prediction Engine
 * Tracks prediction accuracy and learns from results
 */

const fs = require('fs');
const https = require('https');
const path = require('path');

const HISTORY_DIR = path.join(__dirname, 'prediction_history');

// Ensure history directory exists
if (!fs.existsSync(HISTORY_DIR)) {
  fs.mkdirSync(HISTORY_DIR, { recursive: true });
}

class ImprovedPredictor {
  constructor() {
    this.predictions = [];
    this.history = this.loadHistory();
    this.calibration = this.loadCalibration();
  }

  loadHistory() {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const historyFile = path.join(HISTORY_DIR, `predictions_${today}.json`);
    if (fs.existsSync(historyFile)) {
      return JSON.parse(fs.readFileSync(historyFile, 'utf8'));
    }
    return [];
  }

  loadCalibration() {
    // Calibration factors based on historical accuracy
    return {
      // Reduce predictions by this factor to be more realistic
      dailyMultiplier: 0.25, // Was too aggressive at 100%, now at 25%
      minConfidence: 60, // Only predict if confidence > 60%
      maxPredictions: 5, // Top 5 only
      // RSI thresholds
      oversoldMin: 30,
      oversoldMax: 50,
      // Volume surge threshold
      minVolumeSurge: 1.5, // 1.5x average
    };
  }

  async getStockData(code) {
    return new Promise((resolve) => {
      const prefix = code.startsWith('sh') || code.startsWith('sz') ? '' : 
                     code.startsWith('6') ? 'sh' : 'sz';
      const url = `https://qt.gtimg.cn/q=${prefix}${code}`;
      
      https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            // Parse Tencent API format
            const match = data.match(/"([^~]+)~([^~]+)~([^~]+)~([^~]+)~([^~]+)~([^~]+)~([^~]+)~/);
            if (match) {
              resolve({
                code: code,
                name: match[1],
                price: parseFloat(match[4]),
                change: parseFloat(match[5]),
                volume: parseInt(match[6]),
                amount: parseInt(match[7])
              });
            } else {
              resolve(null);
            }
          } catch (e) {
            resolve(null);
          }
        });
      }).on('error', () => resolve(null));
    });
  }

  calculatePrediction(stock) {
    // More realistic prediction algorithm
    let score = 0;
    let factors = [];

    // 1. Price momentum (30% weight)
    const change = Math.abs(stock.change || 0);
    if (change >= 3 && change <= 8) {
      score += 30;
      factors.push('Momentum 3-8%: +30');
    } else if (change > 8) {
      score += 15; // Too high might reverse
      factors.push('High change >8%: +15');
    } else {
      score += change * 5;
      factors.push('Momentum: +' + (change * 5).toFixed(0));
    }

    // 2. Volume analysis (25% weight)
    const volumeRatio = (stock.volume || 0) / 100000; // Normalize
    if (volumeRatio > 50) {
      score += 25;
      factors.push('High volume: +25');
    } else if (volumeRatio > 20) {
      score += 15;
      factors.push('Medium volume: +15');
    }

    // 3. Apply calibration
    const predictedSurge = Math.round(score * this.calibration.dailyMultiplier);
    
    return {
      code: stock.code,
      name: stock.name,
      score: score,
      predictedSurge: predictedSurge,
      actualChange: stock.change || 0,
      factors: factors,
      confidence: Math.min(100, score)
    };
  }

  async scanForPicks() {
    console.log('🔍 SCANNING FOR DAILY PICKS (Improved Algorithm)');
    console.log('='.repeat(60));
    
    // Scan a focused list of hot stocks
    const watchList = [
      '300308', '300476', '300033', '300750', '002594', // Tech/NEV
      '600276', '000651', '600085', // Consumption
      '601012', '600089', // Solar/Energy
      '000792', '600096', // Chemical
      '688256', '300014', // Battery
      '870299', '872926', '835670' // BSE
    ];

    const predictions = [];
    
    for (const code of watchList.slice(0, 10)) {
      const stock = await this.getStockData(code);
      if (stock && stock.price > 0) {
        const pred = this.calculatePrediction(stock);
        
        // Only include if meets minimum criteria
        if (pred.confidence >= this.calibration.minConfidence) {
          predictions.push(pred);
        }
      }
    }

    // Sort by predicted surge (highest first)
    predictions.sort((a, b) => b.predictedSurge - a.predictedSurge);
    
    // Take top 5
    const topPicks = predictions.slice(0, this.calibration.maxPredictions);

    // Save predictions
    this.savePredictions(topPicks);

    return topPicks;
  }

  savePredictions(predictions) {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const file = path.join(HISTORY_DIR, `predictions_${today}.json`);
    
    const data = {
      date: today,
      predictions: predictions,
      calibration: this.calibration
    };
    
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
    console.log(`📁 Saved predictions to: ${file}`);
  }

  async checkAccuracy() {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const file = path.join(HISTORY_DIR, `predictions_${today}.json`);
    
    if (!fs.existsSync(file)) {
      console.log('No predictions found for today');
      return;
    }

    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    console.log('\n📊 PREDICTION ACCURACY CHECK');
    console.log('='.repeat(60));

    let hits = 0;
    let total = data.predictions.length;

    for (const pred of data.predictions) {
      const stock = await this.getStockData(pred.code);
      const actual = stock ? stock.change : 0;
      const success = actual >= 3;
      
      if (success) hits++;
      
      const status = success ? '✅' : '❌';
      console.log(status, pred.code, pred.name.padEnd(8), 
                  'Pred:', pred.predictedSurge + '%'.padStart(4),
                  'Actual:', (actual >= 0 ? '+' : '') + actual.toFixed(2) + '%');
    }

    const accuracy = total > 0 ? (hits / total * 100).toFixed(1) : 0;
    console.log('='.repeat(60));
    console.log(`📈 Accuracy: ${hits}/${total} (${accuracy}%)`);
    
    // Adjust calibration if needed
    if (accuracy < 30) {
      console.log('⚠️ Low accuracy - adjusting algorithm...');
      this.calibration.dailyMultiplier *= 0.8;
      console.log('New multiplier:', this.calibration.dailyMultiplier);
    }
    
    return { hits, total, accuracy };
  }

  generateReport() {
    return `
======================================================================
📊 SUPER BRAIN V3 - IMPROVED DAILY PREDICTION REPORT
======================================================================
Date: ${new Date().toLocaleDateString()}

🎯 IMPROVED ALGORITHM:
- More conservative predictions (multiplier: ${this.calibration.dailyMultiplier})
- Minimum confidence threshold: ${this.calibration.minConfidence}%
- Top ${this.calibration.maxPredictions} picks only
- Volume + Momentum analysis

📁 History saved to: ${HISTORY_DIR}
======================================================================
`;
  }
}

// Run
const predictor = new ImprovedPredictor();

const args = process.argv.slice(2);
if (args[0] === 'check') {
  predictor.checkAccuracy();
} else {
  predictor.scanForPicks().then(picks => {
    console.log('\n🎯 TOP DAILY PICKS (Improved):');
    console.log('-'.repeat(60));
    picks.forEach((p, i) => {
      console.log(`${i+1}. ${p.code} ${p.name} - Predicted: +${p.predictedSurge}% (Confidence: ${p.confidence}%)`);
    });
    console.log(predictor.generateReport());
  });
}

module.exports = ImprovedPredictor;

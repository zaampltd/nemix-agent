const fs = require('fs');
const path = require('path');

const EMAILS_PATH = path.join(__dirname, 'data', 'emails', 'index.json');
const ACTIVITY_PATH = path.join(__dirname, 'data', 'activity.json');

try {
  const subject = "Famous Product Report - Apple iPhone";
  const body = `[Delta-Analyst]: I've initiated a Google search to identify a highly famous product. The search results have yielded a popular product: "Apple iPhone". I've compiled a detailed report on the product, which includes information on its features, specifications, market trends, and customer reviews.

**Introduction:** The Apple iPhone is a line of smartphones designed and marketed by Apple Inc. It is one of the most popular and influential smartphones on the market.

**Key Features:**
1. Multi-Touch Display
2. iOS Operating System
3. High-Quality Camera
4. Water-Resistant Design
5. Fast Charging Capability

**Specifications:**
1. Display: 6.1-inch Super Retina HD display
2. Processor: A15 Bionic chip
3. RAM: 6GB
4. Storage: 64GB, 128GB, or 256GB
5. Battery Life: Up to 12 hours of internet use

**Market Trends:** The Apple iPhone has been a top-selling smartphone for several years, with a loyal customer base. The latest models have seen significant improvements in camera quality, performance, and design.

**Customer Reviews:** Customers praise the iPhone's ease of use, high-quality display, and seamless integration with other Apple devices. Some users have reported issues with battery life and the high cost of the device.

**Additional Information:** The Apple iPhone is available in various models, including the iPhone 13, iPhone 13 Pro, and iPhone 13 Pro Max. Prices start at around $599 for the base model and can go up to over $1,500 for the high-end models. Please let me know if you would like me to provide further information or assistance.`;

  // 1. Backfill Email
  let emails = [];
  if (fs.existsSync(EMAILS_PATH)) {
    emails = JSON.parse(fs.readFileSync(EMAILS_PATH, 'utf-8'));
  }
  
  const newEmail = {
    from: "Delta-Analyst",
    to: "Founder (You)",
    subject: subject,
    body: body,
    status: "sent",
    id: `email_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`,
    timestamp: new Date().toISOString()
  };

  emails.unshift(newEmail);
  fs.writeFileSync(EMAILS_PATH, JSON.stringify(emails, null, 2), 'utf-8');

  // 2. Add Activity item
  let activities = [];
  if (fs.existsSync(ACTIVITY_PATH)) {
    activities = JSON.parse(fs.readFileSync(ACTIVITY_PATH, 'utf-8'));
  }

  const newActivity = {
    id: `act_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`,
    type: "agent",
    message: `Dispatched email: "${subject}" to Founder (You).`,
    timestamp: new Date().toISOString(),
    agentId: "agent_analyst"
  };

  activities.unshift(newActivity);
  if (activities.length > 100) activities.pop();
  fs.writeFileSync(ACTIVITY_PATH, JSON.stringify(activities, null, 2), 'utf-8');

  console.log("SUCCESSFULLY BACKFILLED THE EMAIL DIRECTLY TO JSON DATA!");
} catch (e) {
  console.error("Backfill failed:", e);
}

import cron from 'node-cron';
import axios from 'axios';
import os from 'os';
import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import path from 'path';

const prisma = new PrismaClient();

const app = express();
app.use(express.static(path.join(__dirname, '../public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Function to check API uptime
async function checkAPIHealth(): Promise<string> {
  try {
    const response = await axios.get('https://your-api-endpoint.com/health');
    return response.status === 200 ? 'UP' : `DOWN (${response.status})`;
  } catch (error) {
    return `DOWN (${(error as Error).message})`;
  }
}

// Function to monitor system health
async function monitorSystemHealth(): Promise<void> {
  const systemId = os.hostname(); // Use hostname as system identifier
  const cpuLoad = os.loadavg()[0]; // 1-minute load average
  const freeMemory = os.freemem();
  const totalMemory = os.totalmem();
  const usedMemory = totalMemory - freeMemory;
  const apiStatus = await checkAPIHealth();

  await prisma.healthLog.create({
    data: {
      cpuLoad,
      memoryUsage: usedMemory / 1024 / 1024, // Convert to MB
      apiStatus,
      systemId
    },
  });

  console.log(`[${new Date().toISOString()}] Health Data Logged for system ${systemId}:`);
  console.log(`CPU Load: ${cpuLoad.toFixed(2)}`);
  console.log(`Memory Usage: ${(usedMemory / 1024 / 1024).toFixed(2)} MB`);
  console.log(`API Status: ${apiStatus}`);
}

// Schedule tasks - runs every 2 minutes
cron.schedule('*/2 * * * *',monitorSystemHealth);

// Dashboard route
app.get('/', async (req: Request, res: Response) => {
  const systemId = os.hostname();
  const logs = await prisma.healthLog.findMany({
    where: { systemId },
    orderBy: { timestamp: 'desc' },
    take: 20
  });
  
  res.render('dashboard', { 
    logs: logs.reverse(),
    systemId: systemId
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  // Run initial monitoring
  monitorSystemHealth();
});
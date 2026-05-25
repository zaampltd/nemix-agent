const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'page.tsx');
let code = fs.readFileSync(filePath, 'utf-8');

// ─── FIX 1: Restore the corrupted handleBoardApproval function ───
// The corruption is that lines 419-424 merged two sections together
// Pattern: "confetti({\r\n          particleCount: 50,\r\n  const devAgent..."
const corruptedBlock = `      if (decision === 'approved') {\r\n        confetti({\r\n          particleCount: 50,\r\n  const devAgent`;

const fixedBlock = `      if (decision === 'approved') {\r\n        confetti({\r\n          particleCount: 50,\r\n          spread: 40,\r\n          colors: ['#10b981', '#ffffff']\r\n        });\r\n      }\r\n\r\n    } catch (e: any) {\r\n      addLocalLog(\`[Error] Board decision failed to register: \${e?.message}\`);\r\n    }\r\n  };\r\n\r\n  // ─── Hire Custom Worker Agent ───\r\n  const handleHireAgent = () => {\r\n    if (!newAgentName.trim() || !newAgentRole.trim()) return;\r\n\r\n    const newAgent = {\r\n      id: \`agent_\${Math.random().toString(36).substring(2, 9)}\`,\r\n      role: newAgentRole,\r\n      name: newAgentName,\r\n      avatar: '🤖',\r\n      status: 'sleeping'\r\n    };\r\n\r\n    setAgents(prev => [...prev, newAgent]);\r\n    addLocalLog(\`[CEO] Swarm expanded! Recruited "\${newAgentName}" as "\${newAgentRole}".\`);\r\n    setIsHireModalOpen(false);\r\n    setNewAgentName("");\r\n    setNewAgentRole("");\r\n  };\r\n\r\n  // ─── Swarm Chat Prompt Submissions (Nvmix API Live) ───\r\n  const handleSendPromptMessage = async (e) => {\r\n    e.preventDefault();\r\n    if (!typedMessage.trim()) return;\r\n\r\n    const userMsg = {\r\n      id: Math.random().toString(),\r\n      sender: 'Board Member (You)',\r\n      text: typedMessage,\r\n      timestamp: new Date().toLocaleTimeString(),\r\n      isAgent: false\r\n    };\r\n\r\n    setChatMessages(prev => [...prev, userMsg]);\r\n    const sentMessage = typedMessage.trim();\r\n    setTypedMessage("");\r\n\r\n    const typingId = Math.random().toString();\r\n    setChatMessages(prev => [...prev, {\r\n      id: typingId,\r\n      sender: 'Orchestrator-Alpha (CEO)',\r\n      text: '...',\r\n      timestamp: new Date().toLocaleTimeString(),\r\n      isAgent: true\r\n    }]);\r\n\r\n    try {\r\n      const res  = await fetch('/api/chat', {\r\n        method:  'POST',\r\n        headers: { 'Content-Type': 'application/json' },\r\n        body:    JSON.stringify({ message: sentMessage, channel: activeChannel })\r\n      });\r\n      const data = await res.json();\r\n      setChatMessages(prev => prev.filter(m => m.id !== typingId).concat({\r\n        id:        Math.random().toString(),\r\n        sender:    data.agent || 'Orchestrator-Alpha (CEO)',\r\n        text:      data.reply || 'Processing complete. Standing by for next directive.',\r\n        timestamp: new Date().toLocaleTimeString(),\r\n        isAgent:   true\r\n      }));\r\n    } catch {\r\n      setChatMessages(prev => prev.filter(m => m.id !== typingId).concat({\r\n        id:        Math.random().toString(),\r\n        sender:    'Orchestrator-Alpha (CEO)',\r\n        text:      'Nvmix gateway temporarily unreachable. Operating in local standby mode. All agents ready.',\r\n        timestamp: new Date().toLocaleTimeString(),\r\n        isAgent:   true\r\n      }));\r\n    }\r\n  };\r\n\r\n  // Hired agent references\r\n  const devAgent`;

if (code.includes(corruptedBlock)) {
  code = code.replace(corruptedBlock, fixedBlock);
  fs.writeFileSync(filePath, code, 'utf-8');
  console.log('✅ FIX APPLIED: Restored handleBoardApproval, handleHireAgent, and handleSendPromptMessage');
} else {
  // Try to find the corruption differently
  const idx = code.indexOf('particleCount: 50,\r\n  const devAgent');
  if (idx !== -1) {
    console.log('Found corruption at char index:', idx);
    console.log('Context:', JSON.stringify(code.substring(idx - 100, idx + 200)));
  } else {
    console.log('Corruption pattern not found. Searching for nearby markers...');
    const confIdx = code.indexOf('particleCount: 50,');
    console.log('confetti particleCount line at index:', confIdx);
    if (confIdx !== -1) {
      console.log('Context around confetti:', JSON.stringify(code.substring(confIdx - 50, confIdx + 300)));
    }
  }
}

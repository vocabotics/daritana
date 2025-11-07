# 🤖 ARIA AI Assistant - Setup Guide

ARIA is now fully integrated into your Daritana platform! This guide will help you get it up and running.

## 🚀 Quick Start

### 1. **Environment Setup**
Copy the example environment file and configure your API keys:

```bash
cp .env.example .env
```

Edit `.env` file and add your OpenRouter API key (this is the minimum requirement):

```bash
# REQUIRED: Get from https://openrouter.ai/keys
VITE_OPENROUTER_API_KEY=your_api_key_here
```

### 2. **Start the Application**
```bash
npm run dev
```

### 3. **Access ARIA**
Once logged in, ARIA is available in multiple ways:

- **🎯 Floating Assistant**: Always visible in bottom-right corner
- **🧠 Command Center**: Navigate to "ARIA Assistant" in the sidebar
- **📱 Direct URL**: Visit `/aria` in your browser

## 🔧 Core Features Available

### ✅ **Immediately Available** (with just OpenRouter API key):
- 💬 **AI Chat**: Ask questions about projects, tasks, architecture
- 🎯 **Quick Actions**: Generate timelines, check compliance, analyze risks  
- 📋 **Task Management**: AI-powered task prioritization and suggestions
- 🏗️ **Design Assistance**: Architectural guidance and design concepts
- 📊 **Analytics**: AI usage tracking and performance metrics
- 🔄 **Template System**: Pre-built prompts for common tasks

### 🔌 **Advanced Features** (require additional API keys):
- 📧 **Email Notifications**: Professional email templates (SendGrid)
- 💬 **Slack Integration**: Team notifications and bot interactions  
- 📱 **WhatsApp Business**: Task reminders and project updates
- 📄 **Document Review**: Automated compliance and quality checking
- 🧠 **Vector Search**: RAG-powered knowledge base (Pinecone)

## 🎮 How to Use ARIA

### **Floating Assistant** (Always Present)
- Click the purple brain icon in bottom-right corner
- Ask questions like:
  - "What tasks are due today?"
  - "Check compliance for my project"
  - "Generate a project timeline"
  - "What's the status of Project Alpha?"
- Use voice input by clicking the microphone
- Access quick actions and suggestions

### **Command Center** (Full Power)
- Click "ARIA Assistant" in the sidebar
- Access all AI features and analytics
- Execute bulk operations
- Monitor AI usage and costs
- Manage templates and workflows

### **Voice Commands Examples**
- "Show me overdue tasks"
- "Create a meeting summary"
- "Check UBBL compliance"
- "Generate design suggestions"
- "What's my team performance?"

## 📧 Communication Setup (Optional)

### **Email Integration**
For professional email notifications:

1. **SendGrid (Recommended)**:
   ```bash
   VITE_SENDGRID_API_KEY=your_sendgrid_key
   VITE_FROM_EMAIL=noreply@yourdomain.com
   ```

2. **SMTP Alternative**:
   ```bash
   VITE_SMTP_HOST=smtp.gmail.com
   VITE_SMTP_USER=your_email@gmail.com  
   VITE_SMTP_PASSWORD=your_app_password
   ```

### **Slack Integration**
For team notifications and bot interactions:

1. Create a Slack App at https://api.slack.com/apps
2. Add these scopes: `chat:write`, `users:read`, `channels:read`
3. Install to your workspace and get tokens:
   ```bash
   VITE_SLACK_BOT_TOKEN=xoxb-your-bot-token
   VITE_SLACK_SIGNING_SECRET=your_signing_secret
   ```

### **WhatsApp Business** 
For mobile notifications:

1. Set up WhatsApp Business API
2. Add credentials:
   ```bash
   VITE_WHATSAPP_BUSINESS_PHONE_ID=your_phone_id
   VITE_WHATSAPP_ACCESS_TOKEN=your_access_token
   ```

## 🎯 User Experience by Role

### **👑 Admin/Project Lead**
- **ARIA Command Center**: Full analytics and control
- **Team Management**: Proactive task monitoring and escalation
- **System Analytics**: AI usage, costs, and performance metrics
- **Bulk Operations**: Process multiple documents and notifications

### **👷 Staff/Contractors**  
- **ARIA Assistant**: Personal productivity helper
- **Smart Reminders**: Task deadlines and project updates
- **Work Guidance**: Compliance checks and design suggestions
- **Quick Actions**: Generate reports and analyze progress

### **🎨 Designers**
- **ARIA Creative AI**: Design-focused assistance
- **Design Concepts**: AI-generated mood boards and suggestions
- **Brief Processing**: Convert requirements to actionable tasks
- **Portfolio Guidance**: Creative project optimization

### **🏢 Clients**
- **ARIA Project Helper**: Project status and updates
- **Communication**: Direct messaging and notifications  
- **Progress Tracking**: Real-time project insights
- **Meeting Coordination**: Automated scheduling and summaries

## 🔒 Privacy & Security

- **Data Privacy**: All AI processing uses OpenRouter - no data stored with third parties
- **API Key Security**: Environment variables are local-only
- **Rate Limiting**: Built-in protection against excessive usage
- **Cost Controls**: Budget monitoring and usage alerts

## 🆘 Troubleshooting

### **ARIA not appearing?**
1. Check that you're logged in
2. Verify OpenRouter API key is set
3. Check browser console for errors
4. Try refreshing the page

### **AI responses slow/failing?**
1. Check OpenRouter API key validity
2. Verify internet connection
3. Check usage limits on OpenRouter dashboard
4. Try switching to a faster model in settings

### **Communication features not working?**
1. Verify respective API credentials are set
2. Check service status (SendGrid, Slack, WhatsApp)  
3. Review error logs in browser console
4. Test with minimal configuration first

## 🎛️ Advanced Configuration

### **Model Selection**
Choose different AI models for different tasks:
```bash
# High-quality responses (more expensive)
VITE_AI_MODEL_CHAT=openai/gpt-4-turbo-preview

# Fast responses (cheaper)  
VITE_AI_MODEL_FAST=openai/gpt-3.5-turbo

# Creative tasks
VITE_AI_MODEL_CODE=anthropic/claude-3-opus
```

### **Cost Management**
Set budget limits and alerts:
```bash
VITE_AI_MONTHLY_BUDGET_USD=500
VITE_AI_ALERT_THRESHOLD_PERCENT=75
```

### **Performance Optimization**
Enable caching for repeated queries:
```bash
VITE_REDIS_URL=redis://localhost:6379
```

## 🎉 You're Ready!

ARIA is now your intelligent companion throughout the Daritana platform. Start with simple questions and gradually explore more advanced features as you get comfortable.

**Need help?** ARIA itself is the best place to ask - just type "help" or "what can you do?" in the floating assistant! 

---

*🤖 Built with ❤️ using OpenRouter, React, and TypeScript*
import { useState, useEffect } from 'react'
import { Bot, MessageCircle, Lightbulb, HelpCircle, Send } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Textarea } from '../components/ui/textarea'
import { Label } from '../components/ui/label'
import { toast } from 'sonner'
import blink from '../blink/client'

interface TaxConsultation {
  id: string
  userId: string
  sessionId: string
  query: string
  response: string
  createdAt: string
}

const quickTaxQueries = [
  { title: 'Optimize Tax Savings', query: 'How can I optimize my tax savings this quarter?' },
  { title: 'GST Filing Help', query: 'What do I need to know about GST filing deadlines?' },
  { title: 'Expense Deductions', query: 'What business expenses can I claim as deductions?' },
  { title: 'Compliance Check', query: 'Am I compliant with current GST regulations?' },
  { title: 'Quarterly Planning', query: 'Help me plan for quarterly tax payments' },
  { title: 'ITC Optimization', query: 'How can I maximize my Input Tax Credit?' }
]

interface User {
  id: string
  email?: string
}

export default function TaxAdvisor() {
  const [taxQuery, setTaxQuery] = useState('')
  const [taxAdvice, setTaxAdvice] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [consultations, setConsultations] = useState<TaxConsultation[]>([])
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      if (state.user) {
        fetchConsultations()
      }
    })
    return unsubscribe
  }, [])

  const fetchConsultations = async () => {
    try {
      const data = await blink.db.taxConsultations.list({
        orderBy: { createdAt: 'desc' },
        limit: 10
      })
      setConsultations(data)
    } catch (error) {
      console.error('Error fetching consultations:', error)
    }
  }

  const handleTaxAdvice = async (query = taxQuery) => {
    if (!query.trim()) {
      toast.error('Please enter a question')
      return
    }

    if (!user) {
      toast.error('Please sign in to get tax advice')
      return
    }
    
    setIsLoading(true)
    setTaxAdvice('')
    
    try {
      // Get user's financial context
      const expenses = await blink.db.expenses.list()
      const income = await blink.db.income.list()
      
      const totalSales = income.reduce((sum, item) => sum + (item.totalAmount || 0), 0)
      const totalPurchases = expenses.reduce((sum, item) => sum + (item.totalAmount || 0), 0)
      const outputGst = income.reduce((sum, item) => sum + (item.totalGst || 0), 0)
      const inputTaxCredit = expenses.reduce((sum, item) => sum + (item.totalGst || 0), 0)
      const netGstLiability = outputGst - inputTaxCredit
      
      const context = `
        You are a GST and tax expert advisor for Indian freelancers and gig workers. 
        
        Current user's financial context:
        - Total Sales: ₹${totalSales.toLocaleString('en-IN')}
        - Total Purchases: ₹${totalPurchases.toLocaleString('en-IN')}
        - Net GST Liability: ₹${netGstLiability.toLocaleString('en-IN')}
        - Recent expenses: ${expenses.length} transactions
        - Recent income: ${income.length} transactions
        
        Provide practical, actionable tax advice specifically for Indian GST and ITR-4 filing.
        Focus on tax savings, compliance, and optimization strategies.
        Keep your response concise but comprehensive.
      `
      
      // Use Blink AI to generate tax advice
      const response = await blink.ai.generateText({
        prompt: `${context}\n\nUser Question: ${query}`,
        model: 'gpt-4o-mini',
        maxTokens: 500
      })
      
      setTaxAdvice(response.text)
      
      // Save consultation to database
      const consultationData = {
        id: `tax_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: user.id,
        sessionId: `session_${Date.now()}`,
        query: query,
        response: response.text,
        createdAt: new Date().toISOString()
      }
      
      await blink.db.taxConsultations.create(consultationData)
      
      setTaxQuery('')
      toast.success('Tax advice generated successfully')
      fetchConsultations()
      
    } catch (error) {
      console.error('Error getting tax advice:', error)
      toast.error('Failed to get tax advice. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">AI Tax Advisor</h1>
        <p className="text-gray-600">Get personalized tax advice powered by AI for Indian GST and tax compliance</p>
      </div>

      {/* Quick Questions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Quick Questions
          </CardTitle>
          <CardDescription>Common tax questions for freelancers and gig workers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {quickTaxQueries.map((item, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-auto p-4 text-left justify-start"
                onClick={() => handleTaxAdvice(item.query)}
                disabled={isLoading}
              >
                <div>
                  <p className="font-medium text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.query}</p>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Ask Question */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-600" />
            Ask Your Tax Question
          </CardTitle>
          <CardDescription>Get personalized advice based on your financial data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="tax_query">Your Question</Label>
              <Textarea
                id="tax_query"
                value={taxQuery}
                onChange={(e) => setTaxQuery(e.target.value)}
                placeholder="How can I optimize my GST filings? What deductions can I claim as a freelancer? How to calculate input tax credit?"
                rows={3}
                className="resize-none"
              />
            </div>
            <Button 
              onClick={() => handleTaxAdvice()}
              disabled={isLoading || !taxQuery.trim()}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Getting Advice...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Get AI Tax Advice
                </>
              )}
            </Button>
          </div>
          
          {taxAdvice && (
            <Card className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <Bot className="h-5 w-5" />
                  AI Tax Advisor Response
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-slate-700 whitespace-pre-wrap">
                  {taxAdvice}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Tax Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Quick Tax Tips for Freelancers
          </CardTitle>
          <CardDescription>Essential tax knowledge for Indian freelancers and gig workers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-800 mb-2">GST Registration</h4>
              <p className="text-sm text-green-700">Register for GST if your annual turnover exceeds ₹20 lakhs (₹10 lakhs for special states)</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-2">Input Tax Credit</h4>
              <p className="text-sm text-blue-700">Claim ITC on business expenses like office rent, equipment, and professional services</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="font-medium text-purple-800 mb-2">ITR-4 Filing</h4>
              <p className="text-sm text-purple-700">File ITR-4 if you're a freelancer with business income under presumptive taxation</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <h4 className="font-medium text-orange-800 mb-2">Quarterly Returns</h4>
              <p className="text-sm text-orange-700">File GSTR-1 and GSTR-3B quarterly if turnover is less than ₹1.5 crores</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Consultations */}
      {consultations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Recent Consultations
            </CardTitle>
            <CardDescription>Your recent tax advice history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {consultations.slice(0, 3).map((consultation) => (
                <div key={consultation.id} className="border rounded-lg p-4">
                  <div className="mb-2">
                    <p className="font-medium text-sm text-gray-900">Q: {consultation.query}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(consultation.createdAt).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                    <p className="font-medium mb-1">AI Response:</p>
                    <p className="whitespace-pre-wrap">{consultation.response}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
import { Calculator } from 'lucide-react'

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-2xl inline-block mb-6 animate-pulse">
          <Calculator className="h-12 w-12 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">GST Pro</h1>
        <p className="text-gray-600 mb-4">Loading your tax platform...</p>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    </div>
  )
}

import React, { Suspense } from 'react'
import SubscriptionPlansPage from '@/components/marketplace/SubscriptionPlansPage'
import { Loader2 } from 'lucide-react'

export default function SubscriptionPage() {
    return (
        <div>
            <Suspense fallback={
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-white" />
                </div>
            }>
                <SubscriptionPlansPage />
            </Suspense>
        </div>
    )
}

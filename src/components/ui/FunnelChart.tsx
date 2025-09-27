'use client';

interface FunnelStep {
  step: string;
  users: number;
  conversionRate: number;
}

interface FunnelChartProps {
  data: FunnelStep[];
  overallConversion: number;
}

export function FunnelChart({ data, overallConversion }: FunnelChartProps) {
  if (data.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
        No funnel data available
      </div>
    );
  }

  const maxUsers = Math.max(...data.map(d => d.users));

  return (
    <div className="space-y-4">
      {/* Overall conversion rate */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
          {overallConversion}%
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Overall Conversion Rate
        </p>
      </div>

      {/* Funnel steps */}
      <div className="space-y-3">
        {data.map((step, index) => {
          const widthPercentage = maxUsers > 0 ? (step.users / maxUsers) * 100 : 0;
          const isFirstStep = index === 0;
          const isLastStep = index === data.length - 1;
          
          return (
            <div key={step.step} className="relative">
              {/* Connection line */}
              {!isFirstStep && (
                <div className="absolute left-1/2 -top-3 w-0.5 h-3 bg-gray-300 dark:bg-gray-600 transform -translate-x-1/2" />
              )}
              
              {/* Funnel segment */}
              <div 
                className="relative mx-auto transition-all duration-300"
                style={{ width: `${widthPercentage}%`, minWidth: '200px' }}
              >
                <div 
                  className={`
                    relative h-16 flex items-center justify-between px-4
                    ${isFirstStep ? 'rounded-t-lg' : ''}
                    ${isLastStep ? 'rounded-b-lg' : ''}
                    ${index % 2 === 0 
                      ? 'bg-blue-500 dark:bg-blue-600' 
                      : 'bg-blue-400 dark:bg-blue-700'
                    }
                    text-white shadow-md hover:shadow-lg transition-shadow
                  `}
                >
                  {/* Step name and users */}
                  <div className="flex-1">
                    <p className="font-medium">{step.step}</p>
                    <p className="text-sm opacity-90">
                      {step.users.toLocaleString()} users
                    </p>
                  </div>
                  
                  {/* Conversion rate */}
                  <div className="text-right">
                    <p className="text-lg font-semibold">
                      {step.conversionRate}%
                    </p>
                    {!isFirstStep && (
                      <p className="text-xs opacity-75">
                        from previous
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Drop-off indicator */}
                {!isLastStep && index > 0 && (
                  <div className="absolute -right-2 top-1/2 transform translate-x-full -translate-y-1/2">
                    <div className="text-sm text-red-500 dark:text-red-400 font-medium">
                      -{(100 - data[index + 1].conversionRate).toFixed(1)}%
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-400">Completed step</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-400">Drop-off rate</span>
          </div>
        </div>
      </div>
    </div>
  );
}

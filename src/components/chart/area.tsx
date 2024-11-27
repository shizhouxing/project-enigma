import * as React from "react"
import { Area, AreaChart, Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Types for the component
type ChartType = "area" | "line"
type TimeRange = "7d" | "30d" | "90d"
type MetricData = {
  date: string
  [key: string]: string | number // Allow any additional metrics
}

interface MetricsChartProps {
  data: MetricData[]
  metrics: {
    [key: string]: {
      label: string
      color: string
    }
  }
  title: string
  description: string
  type?: ChartType
  stacked?: boolean
  defaultTimeRange?: TimeRange
  showTimeRangeSelector?: boolean
}

export default function MetricsChart({
  data,
  metrics,
  title,
  description,
  type = "line",
  stacked = false,
  defaultTimeRange = "30d",
  showTimeRangeSelector = true,
}: MetricsChartProps) {
  const [timeRange, setTimeRange] = React.useState<TimeRange>(defaultTimeRange)
  const [activeMetric, setActiveMetric] = React.useState<string>(Object.keys(metrics)[0])

  const metricKeys = Object.keys(metrics)

  const filteredData = React.useMemo(() => {
    const referenceDate = new Date()
    let daysToSubtract = 90
    if (timeRange === "30d") daysToSubtract = 30
    if (timeRange === "7d") daysToSubtract = 7

    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)

    return data.filter(item => new Date(item.date) >= startDate)
  }, [data, timeRange])

  const totals = React.useMemo(() => {
    return metricKeys.reduce((acc, metric) => ({
      ...acc,
      [metric]: data.reduce((sum, curr) => sum + (Number(curr[metric]) || 0), 0),
    }), {} as Record<string, number>)
  }, [data, metricKeys])

  const chartConfig = React.useMemo(() => {
    return Object.entries(metrics).reduce((acc, [key, value]) => ({
      ...acc,
      [key]: {
        label: value.label,
        color: value.color,
      },
    }), {}) as ChartConfig
  }, [metrics])

  const renderChart = () => {
    const ChartComponent = type === "area" ? AreaChart : LineChart
    
    return (
      <ChartContainer
        config={chartConfig}
        className="aspect-auto h-[250px] w-full"
      >
        <ChartComponent data={filteredData}>
          {type === "area" && (
            <defs>
              {metricKeys.map(metric => (
                <linearGradient
                  key={metric}
                  id={`fill${metric}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={metrics[metric].color}
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor={metrics[metric].color}
                    stopOpacity={0.1}
                  />
                </linearGradient>
              ))}
            </defs>
          )}
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={32}
            tickFormatter={(value) => {
              const date = new Date(value)
              return date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })
            }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                labelFormatter={(value) => {
                  return new Date(value).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                }}
                indicator={type === "area" ? "dot" : undefined}
              />
            }
          />
          {type === "area" ? (
            metricKeys.map(metric => (
              <Area
                key={metric}
                dataKey={metric}
                type="natural"
                fill={`url(#fill${metric})`}
                stroke={metrics[metric].color}
                stackId={stacked ? "a" : undefined}
              />
            ))
          ) : (
            <Line
              dataKey={activeMetric}
              type="monotone"
              stroke={metrics[activeMetric].color}
              strokeWidth={2}
              dot={false}
            />
          )}
          {type === "area" && <ChartLegend content={<ChartLegendContent />} />}
        </ChartComponent>
      </ChartContainer>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {type === "line" ? (
          <div className="flex">
            {metricKeys.map((metric) => (
              <button
                key={metric}
                data-active={activeMetric === metric}
                className="flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6"
                onClick={() => setActiveMetric(metric)}
              >
                <span className="text-xs text-muted-foreground">
                  {metrics[metric].label}
                </span>
                <span className="text-lg font-bold leading-none sm:text-3xl">
                  {totals[metric].toLocaleString()}
                </span>
              </button>
            ))}
          </div>
        ) : showTimeRangeSelector && (
          <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
            <SelectTrigger
              className="w-[160px] rounded-lg sm:ml-auto m-4"
              aria-label="Select time range"
            >
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d">Last 3 months</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
            </SelectContent>
          </Select>
        )}
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {renderChart()}
      </CardContent>
    </Card>
  )
}
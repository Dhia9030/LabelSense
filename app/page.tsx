"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, Shield } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { CircularProgressbar, buildStyles } from "react-circular-progressbar"
import "react-circular-progressbar/dist/styles.css"

interface DefectStats {
  name: string
  value: number
  color: string
}

interface Detection {
  class: number
  x_center: number
  y_center: number
  width: number
  height: number
}

const DEFECT_COLORS = {
  perfect: "#4ade80",
  type1: "#f87171",
  type2: "#fb923c",
}

export default function DefectDetector() {
  const [imageSrc, setImageSrc] = useState<string>("")
  const [detections, setDetections] = useState<Detection[]>([])
  const [confidence, setConfidence] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [totalAnalyzed, setTotalAnalyzed] = useState(0)
  const [stats, setStats] = useState<DefectStats[]>([
    { name: "Perfect Labels", value: 0, color: DEFECT_COLORS.perfect },
    { name: "Type 1 Defects", value: 0, color: DEFECT_COLORS.type1 },
    { name: "Type 2 Defects", value: 0, color: DEFECT_COLORS.type2 },
  ])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [showNoDefectNotification, setShowNoDefectNotification] = useState(false)

  useEffect(() => {
    if (!detections.some((d) => d.class > 0) && !isProcessing && imageSrc) {
      setShowNoDefectNotification(true)
      const timer = setTimeout(() => {
        setShowNoDefectNotification(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [detections, isProcessing, imageSrc])

  const drawDetections = (img: HTMLImageElement, detections: Detection[]) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = img.width
    canvas.height = img.height

    ctx.drawImage(img, 0, 0)

    detections.forEach((detection) => {
      if (detection.class > 0) {
        const { x_center, y_center, width, height } = detection
        const x = (x_center - width / 2) * canvas.width
        const y = (y_center - height / 2) * canvas.height
        const w = width * canvas.width
        const h = height * canvas.height

        const color = detection.class === 1 ? DEFECT_COLORS.type1 : DEFECT_COLORS.type2

        const gradient = ctx.createLinearGradient(x, y, x + w, y + h)
        gradient.addColorStop(0, `${color}99`)
        gradient.addColorStop(1, `${color}cc`)

        ctx.beginPath()
        ctx.moveTo(x + 10, y)
        ctx.lineTo(x + w - 10, y)
        ctx.quadraticCurveTo(x + w, y, x + w, y + 10)
        ctx.lineTo(x + w, y + h - 10)
        ctx.quadraticCurveTo(x + w, y + h, x + w - 10, y + h)
        ctx.lineTo(x + 10, y + h)
        ctx.quadraticCurveTo(x, y + h, x, y + h - 10)
        ctx.lineTo(x, y + 10)
        ctx.quadraticCurveTo(x, y, x + 10, y)
        ctx.closePath()

        ctx.strokeStyle = gradient
        ctx.lineWidth = 3
        ctx.stroke()

        ctx.shadowColor = color
        ctx.shadowBlur = 10
        ctx.stroke()

        ctx.shadowColor = "transparent"
        ctx.shadowBlur = 0

        ctx.fillStyle = color
        ctx.font = "bold 14px sans-serif"
        const label = `Type ${detection.class} Defect`
        ctx.fillText(label, x + 5, y - 5)
      }
    })
  }

  const updateStats = (newDetections: Detection[]) => {
    setTotalAnalyzed((prev) => prev + 1)

    setStats((prev) => {
      const type1Count = newDetections.filter((d) => d.class === 1).length
      const type2Count = newDetections.filter((d) => d.class === 2).length
      const perfectCount = type1Count === 0 && type2Count === 0 ? 1 : 0

      return [
        { name: "Perfect Labels", value: prev[0].value + perfectCount, color: DEFECT_COLORS.perfect },
        { name: "Type 1 Defects", value: prev[1].value + (type1Count > 0 ? 1 : 0), color: DEFECT_COLORS.type1 },
        { name: "Type 2 Defects", value: prev[2].value + (type2Count > 0 ? 1 : 0), color: DEFECT_COLORS.type2 },
      ]
    })
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsProcessing(true)
      const file = e.target.files[0]
      const reader = new FileReader()

      reader.onload = (event) => {
        if (event.target?.result) {
          setImageSrc(event.target.result as string)

          setTimeout(() => {
            const newDetections: Detection[] =
              Math.random() > 0.3
                ? Math.random() > 0.5
                  ? [
                      { class: 1, x_center: 0.7109375, y_center: 0.51171875, width: 0.11953125, height: 0.10390625 },
                      { class: 1, x_center: 0.64140625, y_center: 0.89921875, width: 0.2734375, height: 0.2015625 },
                    ]
                  : [{ class: 2, x_center: 0.7109375, y_center: 0.51171875, width: 0.11953125, height: 0.10390625 }]
                : [{ class: 0, x_center: 0.315625, y_center: 0.57578125, width: 0.35390625, height: 0.5234375 }]

            setDetections(newDetections)
            const randomFactor = Math.random() * 10 - 5 // Variation de ±5%
            const baseConfidence = newDetections.length > 0 ? 80 : 98 // Base en fonction de détection
            const computedConfidence = Math.max(50, Math.min(100, baseConfidence + randomFactor)) // Clamp entre 50 et 100

            setConfidence(parseFloat(computedConfidence.toFixed(1))) // Arrondi à 1 décimale

            setIsProcessing(false)
            updateStats(newDetections)

            const img = new Image()
            img.src = event.target.result as string
            img.onload = () => {
              drawDetections(img, newDetections)
            }
          }, 2000)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-black/80 backdrop-blur-sm p-3 rounded-lg border border-white/10">
          <p className="text-white font-medium">{data.name}</p>
          <p className="text-white/80">
            Count: {data.value} ({((data.value / totalAnalyzed) * 100).toFixed(1)}%)
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div
      className="min-h-screen p-8 font-['Montserrat']"
      style={{
        backgroundImage: `url(https://hebbkx1anhila5yf.public.blob.vercel-storage.com/body-background-P2IAzFxeb9Hvzdo0XEB7yW46y9AUTg.png)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold text-white">LabelSense AI</h1>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-white/60 text-sm">Total Analyzed</p>
              <p className="text-2xl font-bold text-white">{totalAnalyzed}</p>
            </div>
            <Button variant="outline" className="bg-white/10 text-white hover:bg-white/20 border-0">
              <Upload className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card
            className="col-span-2 p-6 overflow-hidden relative border-0 rounded-xl"
            style={{
              backgroundImage: `url(https://hebbkx1anhila5yf.public.blob.vercel-storage.com/billing-background-card-vpCLiB6C3CIIKkoSPgWBbmgZ5s4p2M.png)`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="absolute inset-0 bg-blue-950/40 backdrop-blur-sm" />
            <div className="relative space-y-4">
              <Label htmlFor="image-upload" className="block text-lg font-medium text-white">
                Upload Label Image
              </Label>
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="image-upload"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 transition-colors cursor-pointer text-white w-full"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Choose Image</span>
                  </label>
                </div>
                <Button disabled={isProcessing} className="bg-blue-600 hover:bg-blue-700 text-white border-0 px-6">
                  {isProcessing ? "Processing..." : "Analyze"}
                </Button>
              </div>

              <div className="relative mt-4 border-2 border-dashed rounded-lg min-h-[400px] flex items-center justify-center border-white/20 overflow-hidden bg-white/5">
                {imageSrc ? (
                  <>
                    <canvas ref={canvasRef} className="max-h-[400px] w-full object-contain rounded-lg" />
                    <AnimatePresence>
                      {showNoDefectNotification && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          transition={{ duration: 0.5 }}
                          className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-lg"
                        >
                          <div className="text-center text-white">
                            <Shield className="mx-auto h-16 w-16 mb-4 text-green-400" />
                            <h3 className="text-2xl font-bold mb-2">Perfect Label!</h3>
                            <p>No defects detected in this label.</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <div className="text-center text-white/60">
                    <Upload className="mx-auto h-12 w-12 mb-4" />
                    <p>Drag and drop or click to upload a label image</p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Card
            className="p-6 overflow-hidden relative border-0 rounded-xl"
            style={{
              backgroundImage: `url(https://hebbkx1anhila5yf.public.blob.vercel-storage.com/billing-background-card-vpCLiB6C3CIIKkoSPgWBbmgZ5s4p2M.png)`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="absolute inset-0 bg-blue-950/40 backdrop-blur-sm" />
            <div className="relative">
              <h3 className="text-lg font-medium mb-6 text-white">Analysis Results</h3>
              <div className="flex flex-col items-center">
                <motion.div
                  className="relative w-48 h-48"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                >
                  <CircularProgressbar
                    value={confidence}
                    text={`${confidence}%`}
                    styles={buildStyles({
                      rotation: 0,
                      strokeLinecap: "round",
                      textSize: "16px",
                      pathTransitionDuration: 1,
                      pathColor: `rgba(62, 152, 199, ${confidence / 100})`,
                      textColor: "#ffffff",
                      trailColor: "rgba(255, 255, 255, 0.2)",
                      backgroundColor: "#3e98c7",
                    })}
                  />
                </motion.div>
                <p className="text-lg text-white mt-4">Confidence</p>

                <div className="mt-8 w-full">
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                          animationDuration={1000}
                        >
                          {stats.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color}
                              strokeWidth={2}
                              stroke="rgba(255,255,255,0.1)"
                            />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    {stats.map((stat, index) => (
                      <div key={index} className="text-center">
                        <div
                          className="w-4 h-4 rounded-full mx-auto mb-2"
                          style={{
                            backgroundColor: stat.color,
                            boxShadow: `0 0 10px ${stat.color}, 0 0 20px ${stat.color}`,
                          }}
                        />
                        <p className="text-xs text-white/60">{stat.name}</p>
                        <p className="text-sm font-medium text-white">{stat.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}


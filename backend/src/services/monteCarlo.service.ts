import { prisma } from '../server'

interface SimulationInput {
  variableName: string
  variableType: string
  distributionType: 'triangular' | 'normal' | 'uniform' | 'pert'
  minValue: number
  mostLikely?: number
  maxValue: number
  mean?: number
  standardDev?: number
}

interface SimulationResult {
  expectedDuration: number
  minDuration: number
  maxDuration: number
  standardDeviation: number
  expectedCost: number
  minCost: number
  maxCost: number
  completionProbabilities: Array<{ date: string; probability: number }>
  costProbabilities: Array<{ cost: number; probability: number }>
  criticalPathProbability: Record<string, number>
  percentiles: {
    p10: number
    p25: number
    p50: number
    p75: number
    p90: number
    p95: number
    p99: number
  }
}

class MonteCarloService {
  /**
   * Generate random number based on distribution type
   */
  private generateRandomValue(input: SimulationInput): number {
    switch (input.distributionType) {
      case 'uniform':
        return this.uniformDistribution(input.minValue, input.maxValue)
      
      case 'triangular':
        return this.triangularDistribution(
          input.minValue,
          input.mostLikely || (input.minValue + input.maxValue) / 2,
          input.maxValue
        )
      
      case 'normal':
        return this.normalDistribution(
          input.mean || (input.minValue + input.maxValue) / 2,
          input.standardDev || (input.maxValue - input.minValue) / 6
        )
      
      case 'pert':
        return this.pertDistribution(
          input.minValue,
          input.mostLikely || (input.minValue + input.maxValue) / 2,
          input.maxValue
        )
      
      default:
        return input.mostLikely || (input.minValue + input.maxValue) / 2
    }
  }

  /**
   * Uniform distribution
   */
  private uniformDistribution(min: number, max: number): number {
    return min + Math.random() * (max - min)
  }

  /**
   * Triangular distribution
   */
  private triangularDistribution(min: number, mode: number, max: number): number {
    const u = Math.random()
    const fc = (mode - min) / (max - min)
    
    if (u < fc) {
      return min + Math.sqrt(u * (max - min) * (mode - min))
    } else {
      return max - Math.sqrt((1 - u) * (max - min) * (max - mode))
    }
  }

  /**
   * Normal distribution using Box-Muller transform
   */
  private normalDistribution(mean: number, stdDev: number): number {
    let u = 0, v = 0
    while (u === 0) u = Math.random() // Converting [0,1) to (0,1)
    while (v === 0) v = Math.random()
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
    return mean + z * stdDev
  }

  /**
   * PERT distribution (Beta distribution approximation)
   */
  private pertDistribution(min: number, mode: number, max: number): number {
    const mean = (min + 4 * mode + max) / 6
    const alpha = ((mean - min) / (max - min)) * (((mean - min) * (max - mean)) / ((max - min) ** 2 / 36) - 1)
    const beta = ((max - mean) / (mean - min)) * alpha
    
    // Beta distribution approximation
    const u = Math.random()
    const v = Math.random()
    const x = Math.pow(u, 1 / alpha)
    const y = Math.pow(v, 1 / beta)
    
    return min + (max - min) * (x / (x + y))
  }

  /**
   * Calculate percentile from array of values
   */
  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = values.sort((a, b) => a - b)
    const index = Math.ceil((percentile / 100) * sorted.length) - 1
    return sorted[Math.max(0, index)]
  }

  /**
   * Calculate standard deviation
   */
  private calculateStandardDeviation(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2))
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length
    return Math.sqrt(avgSquaredDiff)
  }

  /**
   * Run Monte Carlo simulation for a project
   */
  async runSimulation(
    projectId: string,
    userId: string,
    iterations: number = 10000,
    confidenceLevel: number = 0.95
  ): Promise<string> {
    try {
      // Get project with tasks and risks
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          tasks: true,
          riskAssessments: true,
        }
      })

      if (!project) {
        throw new Error('Project not found')
      }

      // Prepare simulation inputs
      const inputs: SimulationInput[] = []

      // Add task duration inputs
      project.tasks.forEach(task => {
        if (task.estimatedHours) {
          inputs.push({
            variableName: `Task ${task.title} Duration`,
            variableType: 'duration',
            distributionType: 'triangular',
            minValue: task.estimatedHours * 0.8, // 20% optimistic
            mostLikely: task.estimatedHours,
            maxValue: task.estimatedHours * 1.5, // 50% pessimistic
          })
        }
      })

      // Add risk inputs
      project.riskAssessments.forEach(risk => {
        if (risk.probability > 0 && risk.impact > 0) {
          inputs.push({
            variableName: `Risk: ${risk.title}`,
            variableType: 'risk',
            distributionType: 'uniform',
            minValue: 0,
            maxValue: risk.impact * 10000, // Convert impact to cost
          })
        }
      })

      // Run simulations
      const durations: number[] = []
      const costs: number[] = []
      const taskCriticality: Record<string, number> = {}

      for (let i = 0; i < iterations; i++) {
        let totalDuration = 0
        let totalCost = project.estimatedBudget || 0

        // Simulate each input
        inputs.forEach(input => {
          const value = this.generateRandomValue(input)
          
          if (input.variableType === 'duration') {
            totalDuration += value
            
            // Track task criticality
            const taskName = input.variableName
            if (!taskCriticality[taskName]) {
              taskCriticality[taskName] = 0
            }
            if (value > (input.mostLikely || 0) * 1.2) {
              taskCriticality[taskName]++
            }
          } else if (input.variableType === 'risk') {
            // Apply risk with its probability
            const riskProbability = Math.random()
            if (riskProbability < 0.3) { // Assume 30% probability for risks
              totalCost += value
            }
          }
        })

        durations.push(totalDuration / 24) // Convert hours to days
        costs.push(totalCost)
      }

      // Calculate statistics
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length
      const avgCost = costs.reduce((a, b) => a + b, 0) / costs.length

      // Calculate percentiles
      const percentiles = {
        p10: this.calculatePercentile(durations, 10),
        p25: this.calculatePercentile(durations, 25),
        p50: this.calculatePercentile(durations, 50),
        p75: this.calculatePercentile(durations, 75),
        p90: this.calculatePercentile(durations, 90),
        p95: this.calculatePercentile(durations, 95),
        p99: this.calculatePercentile(durations, 99),
      }

      // Generate probability distributions
      const durationBins = 20
      const durationMin = Math.min(...durations)
      const durationMax = Math.max(...durations)
      const durationStep = (durationMax - durationMin) / durationBins

      const completionProbabilities = []
      for (let i = 0; i <= durationBins; i++) {
        const duration = durationMin + i * durationStep
        const probability = durations.filter(d => d <= duration).length / iterations
        const date = new Date(project.startDate)
        date.setDate(date.getDate() + Math.round(duration))
        completionProbabilities.push({
          date: date.toISOString().split('T')[0],
          probability: Math.round(probability * 100) / 100
        })
      }

      const costBins = 20
      const costMin = Math.min(...costs)
      const costMax = Math.max(...costs)
      const costStep = (costMax - costMin) / costBins

      const costProbabilities = []
      for (let i = 0; i <= costBins; i++) {
        const cost = costMin + i * costStep
        const probability = costs.filter(c => c <= cost).length / iterations
        costProbabilities.push({
          cost: Math.round(cost),
          probability: Math.round(probability * 100) / 100
        })
      }

      // Calculate critical path probability
      const criticalPathProbability: Record<string, number> = {}
      Object.keys(taskCriticality).forEach(task => {
        criticalPathProbability[task] = Math.round((taskCriticality[task] / iterations) * 100) / 100
      })

      // Prepare results
      const results: SimulationResult = {
        expectedDuration: Math.round(avgDuration),
        minDuration: Math.round(Math.min(...durations)),
        maxDuration: Math.round(Math.max(...durations)),
        standardDeviation: Math.round(this.calculateStandardDeviation(durations)),
        expectedCost: Math.round(avgCost),
        minCost: Math.round(Math.min(...costs)),
        maxCost: Math.round(Math.max(...costs)),
        completionProbabilities,
        costProbabilities,
        criticalPathProbability,
        percentiles
      }

      // Save simulation to database
      const simulation = await prisma.monteCarloSimulation.create({
        data: {
          projectId,
          name: `Simulation ${new Date().toISOString()}`,
          description: `Monte Carlo simulation with ${iterations} iterations`,
          iterations,
          confidenceLevel,
          results: results as any,
          expectedDuration: results.expectedDuration,
          minDuration: results.minDuration,
          maxDuration: results.maxDuration,
          standardDeviation: results.standardDeviation,
          expectedCost: results.expectedCost,
          minCost: results.minCost,
          maxCost: results.maxCost,
          completionProbabilities: results.completionProbabilities as any,
          costProbabilities: results.costProbabilities as any,
          criticalPathProbability: results.criticalPathProbability as any,
          runById: userId
        }
      })

      // Save inputs for traceability
      for (const input of inputs) {
        await prisma.monteCarloInput.create({
          data: {
            simulationId: simulation.id,
            ...input
          }
        })
      }

      return simulation.id
    } catch (error) {
      console.error('Monte Carlo simulation error:', error)
      throw error
    }
  }

  /**
   * Get simulation results
   */
  async getSimulationResults(simulationId: string): Promise<any> {
    const simulation = await prisma.monteCarloSimulation.findUnique({
      where: { id: simulationId },
      include: {
        project: true,
        runBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        inputs: true
      }
    })

    if (!simulation) {
      throw new Error('Simulation not found')
    }

    return simulation
  }

  /**
   * Get project simulations history
   */
  async getProjectSimulations(projectId: string): Promise<any[]> {
    const simulations = await prisma.monteCarloSimulation.findMany({
      where: { projectId },
      include: {
        runBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { runAt: 'desc' }
    })

    return simulations
  }
}

export default new MonteCarloService()
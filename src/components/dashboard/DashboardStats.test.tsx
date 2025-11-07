import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DashboardStats } from './DashboardStats'
import { useProjectStore } from '@/store/projectStore'

describe('DashboardStats Component', () => {
  beforeEach(() => {
    // Reset store to initial state with mock data
    useProjectStore.setState({
      projects: useProjectStore.getState().projects,
      tasks: useProjectStore.getState().tasks,
      designBriefs: useProjectStore.getState().designBriefs,
      timelines: useProjectStore.getState().timelines,
    })
  })

  it('renders all stat cards', () => {
    render(<DashboardStats />)
    
    expect(screen.getByText('Active Projects')).toBeInTheDocument()
    expect(screen.getByText('Pending Tasks')).toBeInTheDocument()
    expect(screen.getByText('In Review')).toBeInTheDocument()
    expect(screen.getByText('Completed')).toBeInTheDocument()
  })

  it('displays correct active project count', () => {
    render(<DashboardStats />)
    
    const { projects } = useProjectStore.getState()
    const activeCount = projects.filter(p => p.status === 'active').length
    
    expect(screen.getByText(activeCount.toString())).toBeInTheDocument()
  })

  it('displays correct pending task count', () => {
    render(<DashboardStats />)
    
    const { tasks } = useProjectStore.getState()
    const pendingCount = tasks.filter(t => t.status === 'todo').length
    
    expect(screen.getByText(pendingCount.toString())).toBeInTheDocument()
  })

  it('displays correct in-review count', () => {
    render(<DashboardStats />)
    
    const { tasks } = useProjectStore.getState()
    const reviewCount = tasks.filter(t => t.status === 'review').length
    
    expect(screen.getByText(reviewCount.toString())).toBeInTheDocument()
  })

  it('displays correct completed count', () => {
    render(<DashboardStats />)
    
    const { tasks } = useProjectStore.getState()
    const completedCount = tasks.filter(t => t.status === 'completed').length
    
    expect(screen.getByText(completedCount.toString())).toBeInTheDocument()
  })

  it('shows trend indicators', () => {
    render(<DashboardStats />)
    
    expect(screen.getByText('+2 from last month')).toBeInTheDocument()
    expect(screen.getByText('+5 from yesterday')).toBeInTheDocument()
    expect(screen.getByText('+3 for review')).toBeInTheDocument()
    expect(screen.getByText('+12 this week')).toBeInTheDocument()
  })

  it('renders icons for each stat', () => {
    const { container } = render(<DashboardStats />)
    
    const icons = container.querySelectorAll('svg')
    expect(icons.length).toBeGreaterThanOrEqual(4)
  })
})
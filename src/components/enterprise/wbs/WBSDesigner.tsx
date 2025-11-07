import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Plus, Minus, Edit3, Trash2, ChevronDown, ChevronRight, 
  Save, Download, Upload, Settings, Move, Copy
} from 'lucide-react';
import { enterpriseApi } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
  DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { WBSNode } from '@/types/enterprise-pm';

interface WBSDesignerProps {
  initialNodes?: WBSNode[];
  onSave?: (nodes: WBSNode[]) => void;
  onExport?: (format: 'pdf' | 'excel' | 'ms-project') => void;
}

// Default empty WBS structure for new projects
const defaultWBSStructure: WBSNode[] = [
  {
    id: '1',
    code: '1',
    name: 'Project Root',
    description: 'Main project structure',
    children: [],
    level: 0,
    type: 'phase',
    deliverable: 'Project Deliverables',
    responsibleParty: 'Project Manager'
  }
];

export const WBSDesigner: React.FC<WBSDesignerProps> = ({
  initialNodes = defaultWBSStructure,
  onSave,
  onExport
}) => {
  const [nodes, setNodes] = useState<WBSNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load WBS nodes from API
  useEffect(() => {
    const loadWBSNodes = async () => {
      setIsLoading(true);
      try {
        // For now, we'll use the project ID from the current project
        // In a real implementation, this would be passed as a prop
        const projectId = 'current-project'; // This should come from props or context
        const response = await enterpriseApi.getWBSNodes(projectId);
        if (response.data?.nodes) {
          const formattedNodes = response.data.nodes.map((node: any) => ({
            id: node.id,
            code: node.code || node.wbsCode,
            name: node.name,
            description: node.description,
            parentId: node.parentId,
            children: node.children || [],
            level: node.level || 0,
            type: node.type || 'work-package',
            deliverable: node.deliverable || '',
            responsibleParty: node.responsibleParty || node.assignee || ''
          }));
          setNodes(formattedNodes);
        } else {
          // Fallback to initial nodes or default structure
          setNodes(initialNodes || defaultWBSStructure);
        }
      } catch (error) {
        console.error('Failed to load WBS nodes:', error);
        toast.error('Failed to load WBS structure');
        // Fallback to initial nodes or default structure
        setNodes(initialNodes || defaultWBSStructure);
      } finally {
        setIsLoading(false);
      }
    };

    loadWBSNodes();
  }, [initialNodes]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['1']));
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [editingNode, setEditingNode] = useState<WBSNode | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'tree' | 'outline' | 'chart'>('tree');

  const dragOverRef = useRef<string | null>(null);

  const toggleNode = useCallback((nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  }, [expandedNodes]);

  const addNode = useCallback((parentId: string | undefined, type: WBSNode['type']) => {
    const parent = parentId ? nodes.find(n => n.id === parentId) : null;
    const level = parent ? parent.level + 1 : 0;
    const siblings = nodes.filter(n => n.parentId === parentId);
    const nextNumber = siblings.length + 1;
    
    const parentCode = parent ? parent.code : '';
    const newCode = parentCode ? `${parentCode}.${nextNumber}` : nextNumber.toString();
    
    const newNode: WBSNode = {
      id: `new-${Date.now()}`,
      code: newCode,
      name: `New ${type.replace('-', ' ')}`,
      description: '',
      parentId,
      children: [],
      level,
      type,
      deliverable: '',
      responsibleParty: ''
    };

    setNodes(prev => [...prev, newNode]);
    
    // Update parent's children
    if (parent) {
      setNodes(prev => prev.map(n => 
        n.id === parentId 
          ? { ...n, children: [...n.children, newNode.id] }
          : n
      ));
    }

    setEditingNode(newNode);
    setShowAddDialog(false);
  }, [nodes]);

  const updateNode = useCallback((nodeId: string, updates: Partial<WBSNode>) => {
    setNodes(prev => prev.map(n => 
      n.id === nodeId ? { ...n, ...updates } : n
    ));
  }, []);

  const deleteNode = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    // Remove from parent's children
    if (node.parentId) {
      setNodes(prev => prev.map(n =>
        n.id === node.parentId
          ? { ...n, children: n.children.filter(c => c !== nodeId) }
          : n
      ));
    }

    // Remove node and all descendants
    const toDelete = new Set([nodeId]);
    const findDescendants = (id: string) => {
      const children = nodes.filter(n => n.parentId === id);
      children.forEach(child => {
        toDelete.add(child.id);
        findDescendants(child.id);
      });
    };
    findDescendants(nodeId);

    setNodes(prev => prev.filter(n => !toDelete.has(n.id)));
  }, [nodes]);

  const handleDragStart = (e: React.DragEvent, nodeId: string) => {
    setDraggedNode(nodeId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, nodeId: string) => {
    e.preventDefault();
    dragOverRef.current = nodeId;
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    
    if (!draggedNode || draggedNode === targetId) return;
    
    const draggedNodeData = nodes.find(n => n.id === draggedNode);
    const targetNode = nodes.find(n => n.id === targetId);
    
    if (!draggedNodeData || !targetNode) return;
    
    // Prevent circular dependencies
    const isDescendant = (nodeId: string, ancestorId: string): boolean => {
      const node = nodes.find(n => n.id === nodeId);
      if (!node || !node.parentId) return false;
      if (node.parentId === ancestorId) return true;
      return isDescendant(node.parentId, ancestorId);
    };
    
    if (isDescendant(targetId, draggedNode)) return;
    
    // Move the node
    updateNode(draggedNode, { 
      parentId: targetId, 
      level: targetNode.level + 1 
    });
    
    // Update old parent
    if (draggedNodeData.parentId) {
      setNodes(prev => prev.map(n =>
        n.id === draggedNodeData.parentId
          ? { ...n, children: n.children.filter(c => c !== draggedNode) }
          : n
      ));
    }
    
    // Update new parent
    setNodes(prev => prev.map(n =>
      n.id === targetId
        ? { ...n, children: [...n.children, draggedNode] }
        : n
    ));
    
    setDraggedNode(null);
  };

  const renderNodeRow = (node: WBSNode) => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedNode === node.id;
    const isEditing = editingNode?.id === node.id;

    return (
      <div key={node.id} className="select-none">
        <div
          className={cn(
            "flex items-center p-2 border-b hover:bg-gray-50 cursor-pointer",
            isSelected && "bg-blue-50 border-blue-200",
            dragOverRef.current === node.id && "bg-yellow-50"
          )}
          style={{ paddingLeft: `${node.level * 24 + 12}px` }}
          onClick={() => setSelectedNode(node.id)}
          draggable
          onDragStart={(e) => handleDragStart(e, node.id)}
          onDragOver={(e) => handleDragOver(e, node.id)}
          onDrop={(e) => handleDrop(e, node.id)}
        >
          <div className="flex items-center gap-2 flex-1">
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNode(node.id);
                }}
                className="p-1 hover:bg-gray-200 rounded"
              >
                {isExpanded ? 
                  <ChevronDown className="w-4 h-4" /> : 
                  <ChevronRight className="w-4 h-4" />
                }
              </button>
            ) : (
              <div className="w-6 h-6" />
            )}
            
            <Badge variant={
              node.type === 'phase' ? 'default' :
              node.type === 'deliverable' ? 'secondary' :
              node.type === 'work-package' ? 'outline' : 'destructive'
            } className="text-xs">
              {node.code}
            </Badge>
            
            {isEditing ? (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  value={node.name}
                  onChange={(e) => updateNode(node.id, { name: e.target.value })}
                  className="h-8 text-sm"
                  placeholder="Node name"
                />
                <Button
                  size="sm"
                  onClick={() => setEditingNode(null)}
                  className="h-8"
                >
                  <Save className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <div className="flex-1">
                <span className={cn(
                  "font-medium",
                  node.type === 'phase' && "text-blue-900",
                  node.type === 'deliverable' && "text-green-700",
                  node.type === 'work-package' && "text-orange-700",
                  node.type === 'activity' && "text-purple-700"
                )}>
                  {node.name}
                </span>
                {node.description && (
                  <p className="text-xs text-gray-500 mt-1">{node.description}</p>
                )}
              </div>
            )}
            
            <div className="text-sm text-gray-500 w-32 truncate">
              {node.responsibleParty}
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingNode(node);
                }}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <Edit3 className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAddDialog(true);
                  setSelectedNode(node.id);
                }}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <Plus className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNode(node.id);
                }}
                className="p-1 hover:bg-red-200 rounded text-red-600"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div>
            {node.children.map(childId => {
              const child = nodes.find(n => n.id === childId);
              return child ? renderNodeRow(child) : null;
            })}
          </div>
        )}
      </div>
    );
  };

  const renderOutlineView = () => {
    const rootNodes = nodes.filter(n => !n.parentId);
    
    return (
      <div className="p-6 bg-white">
        <div className="space-y-2">
          {rootNodes.map(node => renderNodeRow(node))}
        </div>
      </div>
    );
  };

  const renderChartView = () => {
    return (
      <div className="p-6 bg-white h-full flex items-center justify-center">
        <div className="text-center">
          <GitBranch className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">WBS Chart View</h3>
          <p className="text-gray-500">Interactive org-chart style WBS visualization coming soon</p>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">Work Breakdown Structure</h2>
          <Select value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tree">Tree View</SelectItem>
              <SelectItem value="outline">Outline</SelectItem>
              <SelectItem value="chart">Chart</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Node
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add WBS Node</DialogTitle>
                <DialogDescription>
                  Create a new work breakdown structure node
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Node Type</label>
                  <Select defaultValue="work-package">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="phase">Phase</SelectItem>
                      <SelectItem value="deliverable">Deliverable</SelectItem>
                      <SelectItem value="work-package">Work Package</SelectItem>
                      <SelectItem value="activity">Activity</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => addNode(selectedNode || undefined, 'work-package')}>
                  Create Node
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" size="sm" onClick={() => onSave?.(nodes)}>
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              console.log('Importing WBS data...');
              // TODO: Implement import functionality
              alert('WBS import feature coming soon!');
            }}
          >
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm" onClick={() => onExport?.('excel')}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              console.log('Opening WBS settings...');
              // TODO: Implement settings panel
              alert('WBS settings coming soon!');
            }}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {viewMode === 'tree' || viewMode === 'outline' ? renderOutlineView() : renderChartView()}
      </div>

      {/* Details Panel */}
      {selectedNode && (
        <div className="h-64 border-t bg-gray-50">
          <div className="p-4">
            <h3 className="font-semibold mb-3">Node Details</h3>
            {(() => {
              const node = nodes.find(n => n.id === selectedNode);
              if (!node) return null;
              
              return (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="font-medium text-gray-700">Code:</label>
                    <p>{node.code}</p>
                  </div>
                  <div>
                    <label className="font-medium text-gray-700">Type:</label>
                    <p className="capitalize">{node.type.replace('-', ' ')}</p>
                  </div>
                  <div>
                    <label className="font-medium text-gray-700">Responsible Party:</label>
                    <p>{node.responsibleParty || 'Not assigned'}</p>
                  </div>
                  <div>
                    <label className="font-medium text-gray-700">Deliverable:</label>
                    <p>{node.deliverable || 'Not specified'}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="font-medium text-gray-700">Description:</label>
                    <p>{node.description || 'No description'}</p>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
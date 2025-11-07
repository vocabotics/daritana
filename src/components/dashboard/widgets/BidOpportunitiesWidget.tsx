import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Calendar, Building } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface BidOpportunity {
  id: string;
  title: string;
  budget: string;
  deadline: string;
  type: string;
}

export default function BidOpportunitiesWidget({ data }: { data: BidOpportunity[] }) {
  const navigate = useNavigate();
  const [showBidDialog, setShowBidDialog] = useState(false);
  const [selectedOpp, setSelectedOpp] = useState<BidOpportunity | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [proposal, setProposal] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  if (!data || !Array.isArray(data)) return null;
  
  const handleViewDetails = (opportunity: BidOpportunity) => {
    navigate(`/marketplace/opportunity/${opportunity.id}`);
    toast.info(`Opening details for ${opportunity.title}`);
  };
  
  const handleOpenBidDialog = (opportunity: BidOpportunity) => {
    setSelectedOpp(opportunity);
    setBidAmount('');
    setProposal('');
    setShowBidDialog(true);
  };
  
  const handleSubmitBid = async () => {
    if (!bidAmount || !proposal) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success(`Bid submitted for ${selectedOpp?.title}`);
    setShowBidDialog(false);
    setSubmitting(false);
  };

  return (
    <>
      <div className="space-y-3">
        {data.map((opportunity) => (
          <div key={opportunity.id} className="border rounded-lg p-3 hover:border-blue-500 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="font-medium text-sm">{opportunity.title}</h4>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    {opportunity.budget}
                  </span>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Due: {new Date(opportunity.deadline).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <Badge variant="outline">
                {opportunity.type}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                className="flex-1"
                onClick={() => handleViewDetails(opportunity)}
              >
                View Details
              </Button>
              <Button 
                size="sm" 
                variant="default" 
                className="flex-1"
                onClick={() => handleOpenBidDialog(opportunity)}
              >
                Submit Bid
              </Button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Bid Submission Dialog */}
      <Dialog open={showBidDialog} onOpenChange={setShowBidDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit Bid</DialogTitle>
          <DialogDescription>
            {selectedOpp?.title}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="budget">Project Budget</Label>
            <p className="text-sm text-gray-500">{selectedOpp?.budget}</p>
          </div>
          
          <div>
            <Label htmlFor="bidAmount">Your Bid Amount (RM)</Label>
            <Input
              id="bidAmount"
              type="number"
              placeholder="Enter your bid amount"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="proposal">Proposal Summary</Label>
            <Textarea
              id="proposal"
              placeholder="Briefly describe your approach and why you're the best fit..."
              rows={4}
              value={proposal}
              onChange={(e) => setProposal(e.target.value)}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowBidDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmitBid} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Bid'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
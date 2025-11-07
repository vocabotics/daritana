import { useState } from 'react';
import { useComplianceStore } from '@/store/complianceStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Search,
  Filter,
  FileText,
  Calculator,
  Ruler,
  Eye,
  BookOpen,
  Building,
  Info
} from 'lucide-react';
import { format } from 'date-fns';

export default function UBBLBrowser() {
  const { ubblClauses } = useComplianceStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [sectionFilter, setSectionFilter] = useState<string>('all');
  const [buildingTypeFilter, setBuildingTypeFilter] = useState<string>('all');

  const filteredClauses = ubblClauses.filter(clause => {
    const matchesSearch = 
      clause.clauseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clause.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clause.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clause.section.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSection = sectionFilter === 'all' || 
      clause.section.toLowerCase().includes(sectionFilter.toLowerCase());
    
    const matchesBuildingType = buildingTypeFilter === 'all' || 
      clause.applicableBuildings.includes(buildingTypeFilter as any);
    
    return matchesSearch && matchesSection && matchesBuildingType;
  });

  // Group clauses by section
  const groupedClauses = filteredClauses.reduce((groups, clause) => {
    const section = clause.section;
    if (!groups[section]) {
      groups[section] = [];
    }
    groups[section].push(clause);
    return groups;
  }, {} as Record<string, typeof ubblClauses>);

  const sections = Array.from(new Set(ubblClauses.map(c => c.section)));

  const ClauseDetailDialog = ({ clause }: { clause: typeof ubblClauses[0] }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            UBBL Clause {clause.clauseNumber}
          </DialogTitle>
          <DialogDescription>
            {clause.section} {clause.subSection && `• ${clause.subSection}`}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">{clause.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {clause.content}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              Effective: {format(new Date(clause.effectiveDate), 'MMM dd, yyyy')}
            </Badge>
            {clause.lastAmended && (
              <Badge variant="outline">
                Amended: {format(new Date(clause.lastAmended), 'MMM dd, yyyy')}
              </Badge>
            )}
          </div>

          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Building className="h-4 w-4" />
              Applicable Building Types
            </h4>
            <div className="flex flex-wrap gap-1">
              {clause.applicableBuildings.map(type => (
                <Badge key={type} variant="secondary" className="text-xs">
                  {type.replace(/_/g, ' ')}
                </Badge>
              ))}
            </div>
          </div>

          {clause.measurements && clause.measurements.length > 0 && (
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Ruler className="h-4 w-4" />
                Measurements & Requirements
              </h4>
              <div className="space-y-2">
                {clause.measurements.map((measurement, index) => (
                  <div key={index} className="bg-muted p-3 rounded-lg">
                    <div className="font-medium text-sm">{measurement.parameter}</div>
                    <div className="text-sm text-muted-foreground">
                      {measurement.minValue && `Min: ${measurement.minValue}${measurement.unit}`}
                      {measurement.minValue && measurement.maxValue && ' • '}
                      {measurement.maxValue && `Max: ${measurement.maxValue}${measurement.unit}`}
                      {measurement.condition && (
                        <div className="mt-1 text-xs">{measurement.condition}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {clause.calculations && clause.calculations.length > 0 && (
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Calculations
              </h4>
              <div className="space-y-3">
                {clause.calculations.map((calc, index) => (
                  <div key={index} className="bg-muted p-4 rounded-lg">
                    <div className="font-medium text-sm mb-2">{calc.name}</div>
                    <div className="font-mono text-sm bg-background p-2 rounded border">
                      {calc.formula}
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      Parameters: {calc.parameters.join(', ')} → {calc.result}
                    </div>
                    {calc.example && (
                      <div className="text-xs text-muted-foreground mt-2 p-2 bg-blue-50 rounded">
                        <strong>Example:</strong> {calc.example}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {clause.exceptions && clause.exceptions.length > 0 && (
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Exceptions
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {clause.exceptions.map((exception, index) => (
                  <li key={index} className="text-muted-foreground">{exception}</li>
                ))}
              </ul>
            </div>
          )}

          {clause.crossReferences.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Related Clauses</h4>
              <div className="flex flex-wrap gap-1">
                {clause.crossReferences.map(ref => (
                  <Badge key={ref} variant="outline" className="text-xs">
                    UBBL {ref}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search UBBL clauses by number, title, or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={sectionFilter} onValueChange={setSectionFilter}>
          <SelectTrigger className="w-[250px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by section" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sections</SelectItem>
            {sections.map(section => (
              <SelectItem key={section} value={section.toLowerCase()}>
                {section}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={buildingTypeFilter} onValueChange={setBuildingTypeFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Building type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Building Types</SelectItem>
            <SelectItem value="residential_low_rise">Residential Low-rise</SelectItem>
            <SelectItem value="residential_high_rise">Residential High-rise</SelectItem>
            <SelectItem value="commercial_retail">Commercial Retail</SelectItem>
            <SelectItem value="commercial_office">Commercial Office</SelectItem>
            <SelectItem value="industrial_light">Industrial Light</SelectItem>
            <SelectItem value="industrial_heavy">Industrial Heavy</SelectItem>
            <SelectItem value="institutional_education">Institutional Education</SelectItem>
            <SelectItem value="institutional_healthcare">Institutional Healthcare</SelectItem>
            <SelectItem value="mixed_development">Mixed Development</SelectItem>
            <SelectItem value="renovation_alteration">Renovation/Alteration</SelectItem>
            <SelectItem value="heritage_restoration">Heritage Restoration</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {Object.keys(groupedClauses).length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No UBBL clauses found</p>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or filter criteria
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-2">
          {Object.entries(groupedClauses).map(([section, clauses]) => (
            <AccordionItem key={section} value={section} className="border rounded-lg">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2 text-left">
                  <FileText className="h-4 w-4" />
                  <div>
                    <div className="font-medium">{section}</div>
                    <div className="text-sm text-muted-foreground">
                      {clauses.length} clause{clauses.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-3">
                  {clauses.map((clause) => (
                    <Card key={clause.id} className="border-l-4 border-l-blue-200">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base flex items-center gap-2">
                              <Badge variant="outline">UBBL {clause.clauseNumber}</Badge>
                              {clause.title}
                            </CardTitle>
                            {clause.subSection && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {clause.subSection}
                              </p>
                            )}
                          </div>
                          <ClauseDetailDialog clause={clause} />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm leading-relaxed mb-3 line-clamp-3">
                          {clause.content}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-1">
                            {clause.applicableBuildings.slice(0, 3).map(type => (
                              <Badge key={type} variant="secondary" className="text-xs">
                                {type.replace(/_/g, ' ')}
                              </Badge>
                            ))}
                            {clause.applicableBuildings.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{clause.applicableBuildings.length - 3} more
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {clause.measurements && clause.measurements.length > 0 && (
                              <div className="flex items-center gap-1">
                                <Ruler className="h-3 w-3" />
                                {clause.measurements.length} measurements
                              </div>
                            )}
                            {clause.calculations && clause.calculations.length > 0 && (
                              <div className="flex items-center gap-1">
                                <Calculator className="h-3 w-3" />
                                {clause.calculations.length} calculations
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
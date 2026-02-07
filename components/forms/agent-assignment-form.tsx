"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

const agentAssignmentSchema = (t: any) => z.object({
  agentId: z.string().min(1, t('error')),
});

export type AgentAssignmentData = z.infer<ReturnType<typeof agentAssignmentSchema>>;

interface AgentAssignmentFormProps {
  currentAgentId?: string | null;
  agents: { id: string; name: string }[];
  onSubmit: (data: AgentAssignmentData) => Promise<void>;
  isLoading?: boolean;
}

export function AgentAssignmentForm({
  currentAgentId,
  agents,
  onSubmit,
  isLoading = false,
}: AgentAssignmentFormProps) {
  const t = useTranslations('Orders.assignModal');

  const form = useForm<AgentAssignmentData>({
    resolver: zodResolver(agentAssignmentSchema(t)),
    defaultValues: {
      agentId: currentAgentId || "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="agentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('label')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('placeholder')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="submit"
            disabled={isLoading}
            className={cn(
              "min-w-[120px] bg-blue-600 hover:bg-blue-700 text-white",
              isLoading && "opacity-50 cursor-not-allowed"
            )}
          >
            {isLoading ? t('saving') : t('submit')}
          </Button>
        </div>
      </form>
    </Form>
  );
}

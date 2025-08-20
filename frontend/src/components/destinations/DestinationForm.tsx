"use client";
import React, { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useCreateDestinationMutation,
  useUpdateDestinationMutation,
} from "@/redux/destinationApi";
import toast from "react-hot-toast";
import { IDestinationApiResponse } from "@/types/destination.types";
import Image from "next/image";
import { extractApiErrorMessage } from "@/utils/extractApiErrorMessage";

const destinationFormSchema = z.object({
  name: z.string().min(1, "Destination name is required"),
  description: z.string().optional(),
  country: z.string().min(1, "Country is required"),
  city: z.string().optional(),
  destinationPhoto: z.any().optional(),
});

type DestinationFormValues = z.infer<typeof destinationFormSchema>;

interface IDestinationFormProps {
  destination?: IDestinationApiResponse;
  mode: "create" | "edit";
}

export default function DestinationForm({
  destination,
  mode,
}: IDestinationFormProps) {
  const router = useRouter();
  const [createDestination, { isLoading: isCreating }] =
    useCreateDestinationMutation();
  const [updateDestination, { isLoading: isUpdating }] =
    useUpdateDestinationMutation();
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(
    destination?.data.photo || null
  );

  const form = useForm<DestinationFormValues>({
    resolver: zodResolver(destinationFormSchema),
    defaultValues: {
      name: destination?.data.name || "",
      description: destination?.data.description || "",
      country: destination?.data.country || "",
      city: destination?.data.city || "",
      destinationPhoto: undefined,
    },
  });

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (value: File | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      onChange(file);
    } else {
      setPreviewUrl(null);
      onChange(null);
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl && !destination?.data.photo) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl, destination?.data.photo]);

  const onSubmit = async (values: DestinationFormValues) => {
    try {
      const formData = new FormData();
      formData.append("name", values.name);
      if (values.description)
        formData.append("description", values.description);
      formData.append("country", values.country);
      if (values.city) formData.append("city", values.city);
      if (values.destinationPhoto)
        formData.append("destinationPhoto", values.destinationPhoto);

      if (mode === "create") {
        await createDestination(formData).unwrap();
        toast.success("Destination created successfully");
      } else {
        await updateDestination({
          id: destination!.data.id.toString(),
          formData,
        }).unwrap();
        toast.success("Destination updated successfully");
      }

      router.push("/dashboard/destinations");
    } catch (error) {
      console.error(`Failed to ${mode} destination:`, error);
      const apiError = extractApiErrorMessage(error);
      toast.error(apiError || `Failed to ${mode} destination`);
    }
  };

  const isLoading = isCreating || isUpdating;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/dashboard/destinations")}
          disabled={isLoading}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>
            {mode === "create" ? "Create New Destination" : "Edit Destination"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Tamale" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., The City of Light" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., France" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Paris" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="destinationPhoto"
                render={({ field: { onChange, value, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel>Destination Photo (Optional)</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, onChange)}
                          {...fieldProps}
                        />
                        {(previewUrl || destination?.data.photo) && (
                          <div className="mt-2">
                            <Image
                              src={previewUrl || destination?.data.photo || ""}
                              alt="Destination photo preview"
                              className="h-24 w-24 object-cover rounded-md border border-input"
                              width={96}
                              height={96}
                            />
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/admin-dashboard/destinations")}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1">
                  <Save className="mr-2 h-4 w-4" />
                  {isLoading
                    ? "Saving..."
                    : mode === "create"
                    ? "Create Destination"
                    : "Update Destination"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

// src/components/hotels/hotel-form.tsx
"use client";
import React, { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useCreateHotelMutation,
  useUpdateHotelMutation,
} from "@/redux/hotelApi";
import { useGetAllDestinationsQuery } from "@/redux/destinationApi";
import toast from "react-hot-toast";
import { IHotel } from "@/types/hotel.types";
import Image from "next/image";
import { extractApiErrorMessage } from "@/utils/extractApiErrorMessage";
import { IDestination } from "@/types/destination.types";

const hotelFormSchema = z.object({
  name: z.string().min(1, "Hotel name is required"),
  description: z.string().optional().nullable(),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  country: z.string().min(1, "Country is required"),
  phone: z.string().optional().nullable(),
  starRating: z.number().min(1).max(5).optional(),
  amenities: z.array(z.string()).optional(),
  destinationId: z.number().min(1, "Destination is required"),
  hotelPhoto: z.any().optional(),
});

type HotelFormValues = z.infer<typeof hotelFormSchema>;

interface IHotelFormProps {
  hotel?: IHotel;
  mode: "create" | "edit";
}

export function HotelForm({ hotel, mode }: IHotelFormProps) {
  const router = useRouter();
  const [createHotel, { isLoading: isCreating }] = useCreateHotelMutation();
  const [updateHotel, { isLoading: isUpdating }] = useUpdateHotelMutation();
  const { data: destinationsData, isLoading: isDestinationsLoading } =
    useGetAllDestinationsQuery({ limit: 100 });
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(
    hotel?.photo || null
  );

  // Transform destinationsData.data to an array of IDestination
  const destinations: IDestination[] = React.useMemo(() => {
    return destinationsData?.data || [];
  }, [destinationsData]);

  const form = useForm<HotelFormValues>({
    resolver: zodResolver(hotelFormSchema),
    defaultValues: {
      name: hotel?.name || "",
      description: hotel?.description || null,
      address: hotel?.address || "",
      city: hotel?.city || "",
      country: hotel?.country || "",
      phone: hotel?.phone || null,
      starRating: hotel?.starRating || 3,
      amenities: hotel?.amenities || [],
      destinationId: hotel?.destination.id || 0,
      hotelPhoto: undefined,
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
      if (previewUrl && !hotel?.photo) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl, hotel?.photo]);

  const onSubmit = async (values: HotelFormValues) => {
    try {
      const formData = new FormData();
      formData.append("name", values.name);
      if (values.description)
        formData.append("description", values.description);
      formData.append("address", values.address);
      formData.append("city", values.city);
      formData.append("country", values.country);
      if (values.phone) formData.append("phone", values.phone);
      if (values.starRating)
        formData.append("starRating", values.starRating.toString());
      if (values.amenities && values.amenities.length > 0) {
        values.amenities.forEach((amenity, index) => {
          formData.append(`amenities[${index}]`, amenity);
        });
      }
      formData.append("destinationId", values.destinationId.toString());
      if (values.hotelPhoto) formData.append("hotelPhoto", values.hotelPhoto);

      if (mode === "create") {
        await createHotel(formData).unwrap();
        toast.success("Hotel created successfully");
      } else {
        await updateHotel({
          id: hotel!.id,
          formData,
        }).unwrap();
        toast.success("Hotel updated successfully");
      }

      router.push("/dashboard/hotels");
    } catch (error) {
      console.error(`Failed to ${mode} hotel:`, error);
      const apiError = extractApiErrorMessage(error).message;
      toast.error(apiError || `Failed to ${mode} hotel`);
    }
  };

  const isLoading = isCreating || isUpdating || isDestinationsLoading;

  return (
    <div className="space-y-6">
      <Card className="max-w-2xl mx-auto">
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hotel Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Grand Hotel" {...field} />
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
                      <Textarea
                        placeholder="e.g., A luxurious hotel with stunning views"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 123 Main St" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Accra" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Ghana" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., +233 123 456 789"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="starRating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Star Rating (Optional)</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={(value) =>
                          field.onChange(parseInt(value))
                        }
                        defaultValue={field.value?.toString()}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select star rating" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <SelectItem key={rating} value={rating.toString()}>
                              {rating} Star{rating > 1 ? "s" : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amenities"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amenities (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., WiFi, Pool, Gym"
                        value={field.value?.join(", ") || ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              ? e.target.value
                                  .split(",")
                                  .map((item) => item.trim())
                              : []
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="destinationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destination</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={(value) =>
                          field.onChange(parseInt(value))
                        }
                        defaultValue={field.value?.toString()}
                        disabled={isDestinationsLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select destination" />
                        </SelectTrigger>
                        <SelectContent>
                          {destinations.map((dest) => (
                            <SelectItem
                              key={dest.id}
                              value={dest.id.toString()}
                            >
                              {dest.name} ({dest.city}, {dest.country})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hotelPhoto"
                render={({ field: { onChange, value, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel>Hotel Photo (Optional)</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, onChange)}
                          {...fieldProps}
                        />
                        {(previewUrl || hotel?.photo) && (
                          <div className="mt-2">
                            <Image
                              src={previewUrl || hotel?.photo || ""}
                              alt="Hotel photo preview"
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
                  onClick={() => router.push("/dashboard/hotels")}
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
                    ? "Create Hotel"
                    : "Update Hotel"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

// src/components/rooms/room-fom.tsx
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCreateRoomMutation, useUpdateRoomMutation } from "@/redux/roomApi";
import { useGetAllHotelsQuery } from "@/redux/hotelApi";
import toast from "react-hot-toast";
import { IRoom } from "@/types/room.types";
import { IHotel } from "@/types/hotel.types";
import Image from "next/image";
import { extractApiErrorMessage } from "@/utils/extractApiErrorMessage";

const roomFormSchema = z.object({
  hotelId: z.number().min(1, "Hotel is required"),
  roomType: z.string().min(1, "Room type is required"),
  price: z.number().min(0, "Price must be a positive number"),
  capacity: z.number().min(1, "Capacity must be at least 1"),
  description: z.string().optional().nullable(),
  amenities: z.array(z.string()).optional(),
  available: z.boolean().optional(),
  roomPhoto: z.any().optional(),
});

type RoomFormValues = z.infer<typeof roomFormSchema>;

interface IRoomFormProps {
  room?: IRoom;
  mode: "create" | "edit";
  hotelId?: number;
}

export function RoomForm({ room, mode, hotelId }: IRoomFormProps) {
  const router = useRouter();
  const [createRoom, { isLoading: isCreating }] = useCreateRoomMutation();
  const [updateRoom, { isLoading: isUpdating }] = useUpdateRoomMutation();

  const { data: hotelsData, isLoading: isHotelsLoading } = useGetAllHotelsQuery(
    { limit: 100 }
  );

  const [previewUrl, setPreviewUrl] = React.useState<string | null>(
    room?.photo || null
  );

  const hotels: IHotel[] = React.useMemo(() => {
    return hotelsData?.data || [];
  }, [hotelsData]);

  const getDefaultHotelId = () => {
    if (room?.hotel?.id) {
      return Number(room.hotel.id);
    }

    if (hotelId) {
      return hotelId;
    }
    return 0;
  };

  const form = useForm<RoomFormValues>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: {
      hotelId: getDefaultHotelId(),
      roomType: room?.roomType || "",
      price: room?.price || 0,
      capacity: room?.capacity || 1,
      description: room?.description || null,
      amenities: room?.amenities || [],
      available: room?.available ?? true,
      roomPhoto: undefined,
    },
  });

  useEffect(() => {
    if (hotelId && hotels.length > 0) {
      const targetHotelId = hotelId;
      const hotelExists = hotels.some((hotel) => hotel.id === targetHotelId);
      if (hotelExists) {
        form.setValue("hotelId", targetHotelId);
      }
    }
  }, [hotelId, hotels, form]);

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
      if (previewUrl && !room?.photo) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl, room?.photo]);

  const onSubmit = async (values: RoomFormValues) => {
    try {
      const formData = new FormData();
      formData.append("hotelId", values.hotelId.toString());
      formData.append("roomType", values.roomType);
      formData.append("price", values.price.toString());
      formData.append("capacity", values.capacity.toString());
      if (values.description)
        formData.append("description", values.description);
      if (values.amenities && values.amenities.length > 0) {
        values.amenities.forEach((amenity, index) => {
          formData.append(`amenities[${index}]`, amenity);
        });
      }
      formData.append("available", String(values.available ?? true));
      if (values.roomPhoto) formData.append("roomPhoto", values.roomPhoto);

      if (mode === "create") {
        const response = await createRoom(formData).unwrap();
        toast.success("Room created successfully");

        router.push(`/dashboard/rooms/${response.data.id}/detail`);
      } else {
        await updateRoom({
          id: room!.id,
          formData,
        }).unwrap();
        toast.success("Room updated successfully");

        const hotelId = values.hotelId;
        router.push(`/dashboard/rooms/${hotelId}/detail`);
      }
    } catch (error) {
      console.error(`Failed to ${mode} room:`, error);
      const apiError = extractApiErrorMessage(error).message;
      toast.error(apiError || `Failed to ${mode} room`);
    }
  };

  const isLoading = isCreating || isUpdating || isHotelsLoading;

  const roomTypes = [
    "Single",
    "Double",
    "Twin",
    "Triple",
    "Suite",
    "Deluxe",
    "Standard",
    "Executive",
    "Presidential",
    "Family",
  ];

  const selectedHotel = hotels.find(
    (hotel) => hotel.id === form.watch("hotelId")
  );

  return (
    <div className="space-y-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>
            {selectedHotel && (
              <div className="text-sm font-normal text-muted-foreground mt-1">
                Selected Hotel: {selectedHotel.name} ({selectedHotel.city},{" "}
                {selectedHotel.country})
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="hotelId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hotel</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={(value) =>
                          field.onChange(parseInt(value))
                        }
                        value={field.value?.toString() || ""}
                        disabled={isHotelsLoading}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              isHotelsLoading
                                ? "Loading hotels..."
                                : "Select hotel"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {hotels.map((hotel) => (
                            <SelectItem
                              key={hotel.id}
                              value={hotel.id.toString()}
                            >
                              {hotel.name} ({hotel.city}, {hotel.country})
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
                name="roomType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room Type</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select room type" />
                        </SelectTrigger>
                        <SelectContent>
                          {roomTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price per Night</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g., 150"
                          min="0"
                          step="0.01"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacity (Guests)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g., 2"
                          min="1"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value) || 1)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Spacious room with ocean view"
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
                name="amenities"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amenities (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Air Conditioning, TV, Mini Bar"
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
                name="available"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Available for Booking</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="roomPhoto"
                render={({ field: { onChange, value, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel>Room Photo (Optional)</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, onChange)}
                          {...fieldProps}
                        />
                        {(previewUrl || room?.photo) && (
                          <div className="mt-2">
                            <Image
                              src={previewUrl || room?.photo || ""}
                              alt="Room photo preview"
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
                  className="flex-1 hover:cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 hover:cursor-pointer"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isLoading
                    ? "Saving..."
                    : mode === "create"
                    ? "Create Room"
                    : "Update Room"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

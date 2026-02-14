"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ImagePlus, Trash2, GripVertical, Save, X, Copy, Plus, ChevronDown, ChevronUp, Bed, Edit2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type RoomImage = {
  id: string;
  hotelId: string;
  category: string;
  title: string | null;
  description: string | null;
  imageUrl: string;
  sortOrder: number;
  isActive: boolean;
  roomNumber?: string | null;
  roomNumbers?: string[];
  roomType: string | null;
  createdAt: string;
  updatedAt: string;
};

type Room = {
  roomNumber: string;
  roomType: string;
  images: RoomImage[];
  isExpanded: boolean;
};

export default function RoomImagesPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [newRoomNumber, setNewRoomNumber] = useState("");
  const [newRoomType, setNewRoomType] = useState("");
  const [isAddingImage, setIsAddingImage] = useState<string | null>(null);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newImageTitle, setNewImageTitle] = useState("");
  const [editingRoom, setEditingRoom] = useState<string | null>(null);
  const [editRoomNumber, setEditRoomNumber] = useState("");
  const [editRoomType, setEditRoomType] = useState("");
  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  const [editImageTitle, setEditImageTitle] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch room images from backend API
  useEffect(() => {
    const fetchRoomImages = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('http://localhost:4000/api/v1/hotels/H-FOURSEASONS/room-images');
        const data = await response.json();
        
        // Group images by room number
        const roomMap = new Map<string, RoomImage[]>();
        data.images.forEach((img: RoomImage) => {
          const roomNums = img.roomNumbers || [];
          roomNums.forEach((roomNum: string) => {
            if (!roomMap.has(roomNum)) {
              roomMap.set(roomNum, []);
            }
            roomMap.get(roomNum)!.push({
              ...img,
              imageUrl: img.imageUrl.startsWith('/') ? `http://localhost:4000${img.imageUrl}` : img.imageUrl
            });
          });
        });
        
        // Convert to Room array
        const roomsData: Room[] = Array.from(roomMap.entries()).map(([roomNumber, images]) => ({
          roomNumber,
          roomType: images[0]?.roomType || "Standard Room",
          images: images.sort((a, b) => a.sortOrder - b.sortOrder),
          isExpanded: false
        }));
        
        setRooms(roomsData);
      } catch (error) {
        console.error('Failed to fetch room images:', error);
        showMessage('error', 'Failed to load room images');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRoomImages();
  }, []);

  const saveToStorage = useCallback((data: Room[]) => {
    // Keep for compatibility, but data is now from API
    const allImages = data.flatMap((r) => r.images);
    localStorage.setItem("mystay_room_images", JSON.stringify(allImages));
  }, []);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleAddRoom = () => {
    if (!newRoomNumber.trim()) {
      showMessage("error", "Please enter a room number");
      return;
    }

    const newRoom: Room = {
      roomNumber: newRoomNumber.trim(),
      roomType: newRoomType.trim() || "Standard Room",
      isExpanded: true,
      images: []
    };

    const updated = [...rooms, newRoom];
    setRooms(updated);
    saveToStorage(updated);
    setNewRoomNumber("");
    setNewRoomType("");
    setIsAddingRoom(false);
    showMessage("success", `Room ${newRoom.roomNumber} added`);
  };

  const handleDuplicateRoom = (room: Room) => {
    const newRoomNum = prompt("Enter the new room number for the duplicate:", `${room.roomNumber}-copy`);
    if (!newRoomNum) return;

    const duplicatedRoom: Room = {
      roomNumber: newRoomNum,
      roomType: room.roomType,
      isExpanded: false,
      images: room.images.map((img) => ({
        ...img,
        id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        roomNumber: newRoomNum,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }))
    };

    const updated = [...rooms, duplicatedRoom];
    setRooms(updated);
    saveToStorage(updated);
    showMessage("success", `Room ${room.roomNumber} duplicated to ${newRoomNum}`);
  };

  const handleDeleteRoom = (roomNumber: string) => {
    if (!confirm(`Delete room ${roomNumber} and all its images?`)) return;
    const updated = rooms.filter((r) => r.roomNumber !== roomNumber);
    setRooms(updated);
    saveToStorage(updated);
    showMessage("success", `Room ${roomNumber} deleted`);
  };

  const handleStartEditRoom = (room: Room) => {
    setEditingRoom(room.roomNumber);
    setEditRoomNumber(room.roomNumber);
    setEditRoomType(room.roomType);
  };

  const handleSaveEditRoom = (oldRoomNumber: string) => {
    const updated = rooms.map((r) => {
      if (r.roomNumber === oldRoomNumber) {
        return {
          ...r,
          roomNumber: editRoomNumber.trim() || oldRoomNumber,
          roomType: editRoomType.trim() || r.roomType,
          images: r.images.map((img) => ({
            ...img,
            roomNumber: editRoomNumber.trim() || oldRoomNumber,
            roomType: editRoomType.trim() || r.roomType,
            updatedAt: new Date().toISOString()
          }))
        };
      }
      return r;
    });
    setRooms(updated);
    saveToStorage(updated);
    setEditingRoom(null);
    showMessage("success", "Room updated");
  };

  const handleToggleExpand = (roomNumber: string) => {
    setRooms(rooms.map((r) => (r.roomNumber === roomNumber ? { ...r, isExpanded: !r.isExpanded } : r)));
  };

  const handleFileUpload = async (roomNumber: string, file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
      const response = await fetch(`${apiBaseUrl}/api/v1/upload`, {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json() as { url: string };
      setNewImageUrl(data.url);
      showMessage("success", "Image uploaded successfully");
    } catch (error) {
      showMessage("error", "Failed to upload image");
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddImage = (roomNumber: string) => {
    if (!newImageUrl.trim()) {
      showMessage("error", "Please enter an image URL");
      return;
    }

    const room = rooms.find((r) => r.roomNumber === roomNumber);
    if (!room) return;

    const newImage: RoomImage = {
      id: `img-${Date.now()}`,
      hotelId: "H-FOURSEASONS",
      category: "room",
      title: newImageTitle.trim() || null,
      description: null,
      imageUrl: newImageUrl.trim(),
      sortOrder: room.images.length + 1,
      isActive: true,
      roomNumber: roomNumber,
      roomType: room.roomType,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updated = rooms.map((r) =>
      r.roomNumber === roomNumber ? { ...r, images: [...r.images, newImage] } : r
    );
    setRooms(updated);
    saveToStorage(updated);
    setNewImageUrl("");
    setNewImageTitle("");
    setIsAddingImage(null);
    showMessage("success", "Image added");
  };

  const handleDeleteImage = (roomNumber: string, imageId: string) => {
    const updated = rooms.map((r) => {
      if (r.roomNumber === roomNumber) {
        const newImages = r.images.filter((img) => img.id !== imageId);
        newImages.forEach((img, i) => {
          img.sortOrder = i + 1;
        });
        return { ...r, images: newImages };
      }
      return r;
    });
    setRooms(updated);
    saveToStorage(updated);
    showMessage("success", "Image removed");
  };

  const handleToggleImageActive = (roomNumber: string, imageId: string) => {
    const updated = rooms.map((r) => {
      if (r.roomNumber === roomNumber) {
        return {
          ...r,
          images: r.images.map((img) =>
            img.id === imageId ? { ...img, isActive: !img.isActive, updatedAt: new Date().toISOString() } : img
          )
        };
      }
      return r;
    });
    setRooms(updated);
    saveToStorage(updated);
  };

  const handleMoveImage = (roomNumber: string, fromIndex: number, direction: "up" | "down") => {
    const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
    const updated = rooms.map((r) => {
      if (r.roomNumber === roomNumber) {
        const newImages = [...r.images];
        if (toIndex < 0 || toIndex >= newImages.length) return r;
        [newImages[fromIndex], newImages[toIndex]] = [newImages[toIndex], newImages[fromIndex]];
        newImages.forEach((img, i) => {
          img.sortOrder = i + 1;
        });
        return { ...r, images: newImages };
      }
      return r;
    });
    setRooms(updated);
    saveToStorage(updated);
  };

  const handleStartEditImage = (img: RoomImage) => {
    setEditingImageId(img.id);
    setEditImageTitle(img.title ?? "");
  };

  const handleSaveEditImage = (roomNumber: string, imageId: string) => {
    const updated = rooms.map((r) => {
      if (r.roomNumber === roomNumber) {
        return {
          ...r,
          images: r.images.map((img) =>
            img.id === imageId
              ? { ...img, title: editImageTitle.trim() || null, updatedAt: new Date().toISOString() }
              : img
          )
        };
      }
      return r;
    });
    setRooms(updated);
    saveToStorage(updated);
    setEditingImageId(null);
    showMessage("success", "Image updated");
  };

  // Get all active images for preview
  const allActiveImages = rooms.flatMap((r) => r.images.filter((img) => img.isActive));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">MyStay Admin</p>
            <h1 className="text-2xl font-semibold">Room Images</h1>
          </div>
        </header>
        <div className="flex h-64 items-center justify-center">
          <div className="text-muted-foreground">Loading room images...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">MyStay Admin</p>
          <h1 className="text-2xl font-semibold">Room Images</h1>
          <p className="text-sm text-muted-foreground">
            Manage room photos by room. Each room can have its own set of images for the guest app carousel.
          </p>
        </div>
        <Button onClick={() => setIsAddingRoom(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Room
        </Button>
      </header>

      {message && (
        <div
          className={cn(
            "rounded-md border px-4 py-3 text-sm",
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          )}
        >
          {message.text}
        </div>
      )}

      {/* Preview Card */}
      {/* <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-base">Guest App Preview</CardTitle>
          <CardDescription>
            All active room images ({allActiveImages.length} images from {rooms.length} rooms)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4">
              {allActiveImages.length > 0 ? (
                allActiveImages.slice(0, 8).map((img) => (
                  <div
                    key={img.id}
                    className="relative h-48 min-w-[180px] flex-shrink-0 overflow-hidden rounded-xl bg-muted/20 shadow-lg"
                  >
                    <Image
                      src={img.imageUrl}
                      alt={img.title ?? "Room photo"}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-2">
                      <Badge variant="secondary" className="bg-white/90 text-xs">
                        Room {img.roomNumber}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex h-48 w-full items-center justify-center rounded-xl bg-muted/20 text-muted-foreground">
                  No active images. Add rooms and images below.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card> */}

      {/* Add Room Modal */}
      {isAddingRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-background/60 backdrop-blur" onClick={() => setIsAddingRoom(false)} />
          <Card className="relative z-10 w-full max-w-md">
            <CardHeader>
              <CardTitle>Add New Room</CardTitle>
              <CardDescription>Create a new room to add images for.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="room-number">Room Number *</Label>
                <Input
                  id="room-number"
                  placeholder="e.g., 701, PH1, Suite A"
                  value={newRoomNumber}
                  onChange={(e) => setNewRoomNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="room-type">Room Type</Label>
                <Input
                  id="room-type"
                  placeholder="e.g., Sea View Suite, Garden Room"
                  value={newRoomType}
                  onChange={(e) => setNewRoomType(e.target.value)}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setIsAddingRoom(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleAddRoom}>
                  Add Room
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Room List */}
      <div className="space-y-4">
        {rooms.map((room) => (
          <Card key={room.roomNumber}>
            <CardHeader
              className="cursor-pointer"
              onClick={() => handleToggleExpand(room.roomNumber)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bed className="h-5 w-5 text-muted-foreground" />
                  {editingRoom === room.roomNumber ? (
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Input
                        value={editRoomNumber}
                        onChange={(e) => setEditRoomNumber(e.target.value)}
                        className="h-8 w-24"
                        placeholder="Room #"
                      />
                      <Input
                        value={editRoomType}
                        onChange={(e) => setEditRoomType(e.target.value)}
                        className="h-8 w-40"
                        placeholder="Room Type"
                      />
                      <Button size="sm" variant="ghost" onClick={() => setEditingRoom(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                      <Button size="sm" onClick={() => handleSaveEditRoom(room.roomNumber)}>
                        <Save className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <CardTitle className="text-base">Room {room.roomNumber}</CardTitle>
                      <CardDescription>{room.roomType}</CardDescription>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{room.images.length} images</Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartEditRoom(room);
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDuplicateRoom(room);
                    }}
                    title="Duplicate room"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteRoom(room.roomNumber);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  {room.isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </div>
            </CardHeader>

            {room.isExpanded && (
              <CardContent className="pt-0">
                <div className="border-t pt-4">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Images for Room {room.roomNumber}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsAddingImage(room.roomNumber)}
                    >
                      <ImagePlus className="mr-1 h-4 w-4" />
                      Add Image
                    </Button>
                  </div>

                  {/* Add Image for this room */}
                  {isAddingImage === room.roomNumber && (
                    <div className="mb-4 rounded-lg border bg-muted/10 p-4">
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label>Upload Image</Label>
                          <div className="flex gap-2">
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  void handleFileUpload(room.roomNumber, file);
                                }
                              }}
                              disabled={isUploading}
                              className="flex-1"
                            />
                            {isUploading && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                Uploading...
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label>Or paste Image URL</Label>
                          <Input
                            placeholder="https://example.com/image.jpg or /uploads/image.jpg"
                            value={newImageUrl}
                            onChange={(e) => setNewImageUrl(e.target.value)}
                            disabled={isUploading}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Title (optional)</Label>
                          <Input
                            placeholder="Bedroom, Bathroom, etc."
                            value={newImageTitle}
                            onChange={(e) => setNewImageTitle(e.target.value)}
                            disabled={isUploading}
                          />
                        </div>
                        {newImageUrl && (
                          <div className="relative h-32 w-full overflow-hidden rounded-lg bg-muted">
                            <Image
                              src={newImageUrl}
                              alt="Preview"
                              fill
                              className="object-cover"
                              unoptimized
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setIsAddingImage(null);
                              setNewImageUrl("");
                              setNewImageTitle("");
                            }}
                          >
                            Cancel
                          </Button>
                          <Button size="sm" onClick={() => handleAddImage(room.roomNumber)}>
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Image Grid */}
                  {room.images.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {room.images.map((img, index) => (
                        <div
                          key={img.id}
                          className={cn(
                            "relative overflow-hidden rounded-lg border",
                            !img.isActive && "opacity-50"
                          )}
                        >
                          <div className="relative h-32">
                            <Image
                              src={img.imageUrl}
                              alt={img.title ?? "Room"}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                          <div className="flex items-center justify-between bg-background p-2">
                            <div className="min-w-0 flex-1">
                              {editingImageId === img.id ? (
                                <div className="flex items-center gap-1">
                                  <Input
                                    value={editImageTitle}
                                    onChange={(e) => setEditImageTitle(e.target.value)}
                                    className="h-7 text-xs"
                                    placeholder="Title"
                                  />
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7"
                                    onClick={() => setEditingImageId(null)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7"
                                    onClick={() => handleSaveEditImage(room.roomNumber, img.id)}
                                  >
                                    <Save className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleStartEditImage(img)}
                                  className="truncate text-xs font-medium hover:underline"
                                >
                                  {img.title || "Untitled"}
                                </button>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleMoveImage(room.roomNumber, index, "up")}
                                disabled={index === 0}
                                className="rounded p-1 hover:bg-muted disabled:opacity-30"
                              >
                                <ChevronUp className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => handleMoveImage(room.roomNumber, index, "down")}
                                disabled={index === room.images.length - 1}
                                className="rounded p-1 hover:bg-muted disabled:opacity-30"
                              >
                                <ChevronDown className="h-3 w-3" />
                              </button>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "cursor-pointer text-[10px]",
                                  img.isActive
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : "border-muted bg-muted/20"
                                )}
                                onClick={() => handleToggleImageActive(room.roomNumber, img.id)}
                              >
                                {img.isActive ? "On" : "Off"}
                              </Badge>
                              <button
                                onClick={() => handleDeleteImage(room.roomNumber, img.id)}
                                className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex h-32 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                      No images yet. Add images for this room.
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        ))}

        {rooms.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bed className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">No rooms yet. Click &quot;Add Room&quot; to get started.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

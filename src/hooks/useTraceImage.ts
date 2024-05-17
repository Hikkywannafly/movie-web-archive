import axios from "axios";

import { getMediaAnimeFromAnilist } from "@/backend/metadata/anilist";

import useMutation from "./useMutation ";

interface RawTraceImageResult {
  filename: string;
  episode: number;
  from: number;
  anilist: number;
  to: number;
  similarity: number;
  video: string;
  image: string;
}

interface RawTraceImageResponse {
  frameCount: number;
  error: string;
  result: RawTraceImageResult[];
}

export interface TraceImageResult {
  anime: any;
  filename: string;
  episode: number;
  from: number;
  to: number;
  similarity: number;
  video: string;
  image: string;
}

export interface TraceImageResponse {
  frameCount: number;
  error: string;
  result: TraceImageResult[];
}

const apiUrl = "https://api.trace.moe/search?cutBorders";

const composeData = (
  traceData: RawTraceImageResponse,
  anilistData: any[],
): any => {
  const newResult = traceData.result
    .map((traceResult) => {
      const anime = anilistData.find((a) => a.id === traceResult.anilist);
      if (!anime) return null;
      return {
        anime,
        filename: traceResult.filename,
        episode: traceResult.episode,
        from: traceResult.from,
        to: traceResult.to,
        similarity: traceResult.similarity,
        video: traceResult.video,
        image: traceResult.image,
      };
    })
    .filter((a) => a);

  return {
    frameCount: traceData.frameCount,
    error: traceData.error,
    result: newResult,
  };
};

export const useTraceImage = () => {
  return useMutation(async (image: any) => {
    let data: RawTraceImageResponse;
    if (image[0]?.file) {
      const formData = new FormData();
      formData.append("image", image[0].file);
      const { data: responseData } = await axios.post<RawTraceImageResponse>(
        apiUrl,
        formData,
      );
      data = responseData;
    } else {
      const { data: responseData } = await axios.get<RawTraceImageResponse>(
        `${apiUrl}&url=${encodeURIComponent(image.dataURL)}`,
      );

      data = responseData;
    }

    if (data.error) throw new Error(data.error);

    const anilistIds = data.result.map((result) => result.anilist);
    // obj to remove to array
    const anilistData = await getMediaAnimeFromAnilist(anilistIds.slice(0, 5));
    const newArray = anilistData.map((item: any) => {
      return {
        id: item.Media.id,
        title: item.Media.title,
      };
    });
    const newData = composeData(data, newArray);
    console.log(newData);
    return newData;
  });
};

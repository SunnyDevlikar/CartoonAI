/*
  # Create images table for storing generated cartoons

  1. New Tables
    - `images`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `image_url` (text)
      - `prompt` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `images` table
    - Add policies for authenticated users to:
      - Insert their own images
      - Read their own images
*/

CREATE TABLE IF NOT EXISTS images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  image_url text NOT NULL,
  prompt text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own images"
  ON images
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own images"
  ON images
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
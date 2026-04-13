-- R2に seed/ フォルダ以下に画像をアップロード後、このSQLを編集して実行してください
-- image_path は R2のオブジェクトキー（例: seed/photo1.jpg）

INSERT INTO bottles (id, user_id, ip_hash, image_path, status, is_seed, delete_ok, created_at)
VALUES
  ('seed-001', '__seed__', '__seed__', 'seed/photo1.jpg', 'waiting', 1, 0, '2026-01-01T00:00:00.000Z'),
  ('seed-002', '__seed__', '__seed__', 'seed/photo2.jpg', 'waiting', 1, 0, '2026-01-01T00:00:00.000Z'),
  ('seed-003', '__seed__', '__seed__', 'seed/photo3.jpg', 'waiting', 1, 0, '2026-01-01T00:00:00.000Z');

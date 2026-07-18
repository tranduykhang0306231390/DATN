<?php

namespace App\Services;

use Illuminate\Database\ConnectionInterface;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use LogicException;

/**
 * Sinh mã tuần tự dạng PREFIX001 trong transaction hiện tại.
 *
 * Lock được giữ đến khi transaction của caller commit/rollback. Primary key
 * của bảng vẫn là lớp bảo vệ cuối cùng nếu database nhận hai request đồng thời.
 */
class SequentialCodeService
{
    public function next(
        string $table,
        string $column,
        string $prefix,
        int $padding = 3
    ): string {
        return $this->nextBatch($table, $column, $prefix, 1, $padding)[0];
    }

    /** @return list<string> */
    public function nextBatch(
        string $table,
        string $column,
        string $prefix,
        int $count,
        int $padding = 3
    ): array {
        $this->assertIdentifier($table);
        $this->assertIdentifier($column);

        if ($prefix === '' || !preg_match('/^[A-Za-z]+$/', $prefix)) {
            throw new InvalidArgumentException('Prefix mã không hợp lệ.');
        }
        if ($count < 1 || $padding < 1) {
            throw new InvalidArgumentException('Số lượng và độ dài mã phải lớn hơn 0.');
        }

        $connection = DB::connection();
        if ($connection->transactionLevel() < 1) {
            throw new LogicException('Mã tuần tự phải được sinh bên trong transaction.');
        }

        $quotedColumn = $this->quoteIdentifier($connection, $column);
        $numberStart = strlen($prefix) + 1;
        $driver = $connection->getDriverName();
        $substring = $driver === 'sqlite'
            ? "SUBSTR({$quotedColumn}, {$numberStart})"
            : "SUBSTRING({$quotedColumn}, {$numberStart})";
        $integerType = match ($driver) {
            'mysql', 'mariadb' => 'UNSIGNED',
            default => 'INTEGER',
        };

        $lastCode = DB::table($table)
            ->where($column, 'like', $prefix . '%')
            ->orderByRaw("CAST({$substring} AS {$integerType}) DESC")
            ->lockForUpdate()
            ->value($column);

        $lastNumber = $this->extractNumber($lastCode, $prefix);
        $codes = [];

        for ($offset = 1; $offset <= $count; $offset++) {
            $codes[] = $prefix . str_pad(
                (string) ($lastNumber + $offset),
                $padding,
                '0',
                STR_PAD_LEFT
            );
        }

        return $codes;
    }

    private function extractNumber(mixed $code, string $prefix): int
    {
        if (!is_string($code)) return 0;

        $pattern = '/^' . preg_quote($prefix, '/') . '(\d+)$/';
        if (!preg_match($pattern, $code, $matches)) return 0;

        return max(0, (int) $matches[1]);
    }

    private function assertIdentifier(string $identifier): void
    {
        if (!preg_match('/^[A-Za-z_][A-Za-z0-9_]*$/', $identifier)) {
            throw new InvalidArgumentException('Tên bảng hoặc cột không hợp lệ.');
        }
    }

    private function quoteIdentifier(ConnectionInterface $connection, string $identifier): string
    {
        return $connection->getDriverName() === 'mysql'
            ? "`{$identifier}`"
            : '"' . $identifier . '"';
    }
}

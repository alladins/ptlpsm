#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Git Commit Script
=================
여러 줄의 커밋 메시지를 입력받아 커밋하는 스크립트

사용법:
    python git_commit.py

    - 커밋 메시지를 여러 줄 입력
    - 빈 줄 2개 연속 입력 시 입력 종료
    - 커밋 실행
"""

import subprocess
import sys


def run_git_command(args, capture_output=True):
    """Git 명령어 실행"""
    try:
        result = subprocess.run(
            ['git'] + args,
            capture_output=capture_output,
            text=True,
            encoding='utf-8',
            errors='replace'
        )
        output = result.stdout.strip() if result.stdout else ''
        if result.returncode != 0:
            error = result.stderr.strip() if result.stderr else ''
            return False, error or output
        return True, output
    except Exception as e:
        return False, str(e)


def get_staged_files():
    """스테이징된 파일 목록 조회"""
    success, output = run_git_command(['diff', '--cached', '--name-only'])
    if success and output:
        return output.split('\n')
    return []


def get_unstaged_files():
    """스테이징 안된 변경 파일 목록"""
    success, output = run_git_command(['status', '--porcelain'])
    if not success or not output:
        return []

    files = []
    for line in output.split('\n'):
        if line.strip():
            files.append(line[3:].strip())
    return files


def show_status():
    """변경사항 표시"""
    print("\n[변경된 파일]")
    print("-" * 40)

    success, output = run_git_command(['status', '--short'])
    if success and output:
        print(output)
    else:
        print("변경된 파일이 없습니다.")
    print("-" * 40)


def stage_all():
    """모든 변경사항 스테이징"""
    success, output = run_git_command(['add', '-A'])
    if success:
        print("✓ 모든 변경사항 스테이징 완료")
        return True
    else:
        print(f"✗ 스테이징 실패: {output}")
        return False


def commit(message):
    """커밋 실행"""
    success, output = run_git_command(['commit', '-m', message])
    if success:
        print("✓ 커밋 완료")
        return True
    else:
        if 'nothing to commit' in output.lower():
            print("⚠ 커밋할 변경사항이 없습니다.")
            return False
        print(f"✗ 커밋 실패: {output}")
        return False


def get_multiline_input():
    """여러 줄 메시지 입력받기"""
    print("\n커밋 메시지를 입력하세요 (빈 줄 2개 연속 입력 시 종료):")
    print("-" * 40)

    lines = []
    empty_count = 0

    while True:
        try:
            line = input()
            if line == "":
                empty_count += 1
                if empty_count >= 2:
                    break
                lines.append(line)
            else:
                empty_count = 0
                lines.append(line)
        except EOFError:
            break
        except KeyboardInterrupt:
            print("\n\n취소되었습니다.")
            return None

    # 마지막 빈 줄 제거
    while lines and lines[-1] == "":
        lines.pop()

    return "\n".join(lines)


def main():
    """메인 함수"""
    print("=" * 50)
    print("  Git Commit Script")
    print("=" * 50)

    # 현재 상태 표시
    show_status()

    # 변경사항 확인
    unstaged = get_unstaged_files()
    if not unstaged and not get_staged_files():
        print("\n변경된 파일이 없습니다.")
        return

    # 스테이징 여부 확인
    if unstaged:
        response = input("\n모든 변경사항을 스테이징할까요? (y/n): ").strip().lower()
        if response in ['y', 'yes', '예']:
            if not stage_all():
                return
        else:
            print("스테이징을 건너뜁니다. 이미 스테이징된 파일만 커밋됩니다.")

    # 커밋 메시지 입력
    message = get_multiline_input()

    if not message:
        print("\n커밋 메시지가 비어있습니다. 커밋을 취소합니다.")
        return

    # 입력된 메시지 확인
    print("\n" + "-" * 40)
    print("[입력된 커밋 메시지]")
    print("-" * 40)
    print(message)
    print("-" * 40)

    # 확인
    response = input("\n이 메시지로 커밋할까요? (y/n): ").strip().lower()
    if response not in ['y', 'yes', '예']:
        print("커밋을 취소합니다.")
        return

    # 커밋 실행
    if commit(message):
        print("\n" + "=" * 50)
        print("  커밋 완료!")
        print("=" * 50)
        print("\n다음 단계:")
        print("  git push origin develop    # develop 브랜치 푸시")
        print("  git checkout main          # main 브랜치로 전환")
        print("  git merge develop          # develop 머지")
        print("  git push origin main       # main 브랜치 푸시")


if __name__ == '__main__':
    main()
